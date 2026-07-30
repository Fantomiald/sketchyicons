// Adding a hand to Lucide's geometry.
//
// Straight runs bow, curves change their fullness, coordinates drift, and the
// drift is seeded from the icon name so two runs produce identical files.
//
// How much hand a coordinate takes is measured, never sorted by hand. The two
// bounds are the run length at the vertex and whether its subpath curves at all.
// docs/heuristic.md has the reasoning and the numbers behind every constant here.

import { parsePath, chordLength, boundsOf } from './geometry.mjs';

/**
 * The default amplitude for the whole catalogue, and its ceiling: everything
 * below scales it down, nothing scales it up. packages/data/overrides.json
 * replaces it.
 */
export const HAND = { drift: 0.6, bow: 1.13 };

/**
 * The amplitude for a subpath of straight runs and nothing else: an arrow, a
 * chevron, a cross. No organic detail, so a wobble reads as broken rather than
 * as drawn. Applied as a ratio of HAND, in RULER_SHARE.
 */
export const RULER = { drift: 0.21, bow: 0.45 };

/**
 * The run length at which drift reaches the full amplitude; below it drift is
 * proportional to the run. A coordinate that wanders further than the run it
 * belongs to is not that run drawn, it is somewhere else.
 */
const SATURATION = 2.4;

/** Below this the drift is not a drawing decision, it is rounding. */
const DRIFT_FLOOR = 0.01;

/** How far a control point may sit off the chord, as a share of the run. */
const BOW_SHARE = 0.5;

/** How much a curve bows, against a straight run of the same length. */
const CURVE_SHARE = 0.6;

/**
 * How much fuller or flatter a curve may come out, as a share of the distance
 * its control points sit from their anchors. Scaled by the amplitude in force.
 */
const CURVE_TENSION = 0.16;

/**
 * How far past its start point a closing stroke may carry, as a share of the
 * drift. A closepath landing exactly where it began is the one thing a hand
 * never does.
 */
const OVERSHOOT_SHARE = 1.25;

/** The largest distance the hand can move a coordinate, for the validator. */
export const allowanceFor = (hand) => hand.drift * (Math.SQRT2 + OVERSHOOT_SHARE);

const round = (n) => Math.round(n * 100) / 100;

/**
 * xorshift over an FNV-1a hash of the icon name. Same name, same drawing,
 * every run, on every machine.
 *
 * @param {string} seedText
 */
export function makeRandom(seedText) {
  let seed = 2166136261;
  for (const character of seedText) {
    seed ^= character.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) % 100000) / 100000;
  };
}

/**
 * True when the icon contains no curve command at all.
 *
 * @param {{ d: string }[]} paths
 */
export function isStraight(paths) {
  for (const { d } of paths) {
    for (const segment of parsePath(d)) {
      if (segment.kind === 'C' || segment.kind === 'Q') return false;
    }
  }
  return true;
}

/**
 * The amplitude an icon starts from. Always the same one: which parts stay calm
 * is decided per subpath below. The straight flag is for reporting.
 *
 * @param {{ d: string }[]} paths
 * @returns {{ drift: number, bow: number, straight: boolean }}
 */
export function handFor(paths) {
  return { ...HAND, straight: isStraight(paths) };
}

/**
 * What a straight subpath keeps of the amplitude. A share rather than a fixed
 * pair, so an override on an icon carries through to its straight parts.
 */
const RULER_SHARE = { drift: RULER.drift / HAND.drift, bow: RULER.bow / HAND.bow };

/**
 * The box the drawn version may occupy. A 2 unit stroke is clipped unless its
 * centre stays a unit inside the viewBox, so the margin holds, except where the
 * source already breaks it: save-off carries a stray run at x 29.5 that the
 * renderer clips, and pulling it into view would draw a stroke Lucide does not.
 *
 * @param {{ d: string }[]} paths
 */
export function frameFor(paths) {
  const segments = paths.flatMap(({ d }) => parsePath(d));
  const source = boundsOf(segments);
  return {
    minX: Math.min(0.75, source.minX),
    minY: Math.min(0.75, source.minY),
    maxX: Math.max(23.25, source.maxX),
    maxY: Math.max(23.25, source.maxY),
    source,
  };
}

/**
 * For each segment, the shorter of the two runs meeting at the point it ends on.
 * Moving the shared end of an 8 unit run and a 0.01 unit run leaves the first
 * recognisable and takes the second somewhere else, so the shorter one decides.
 *
 * @param {import('./geometry.mjs').Segment[]} segments
 * @returns {number[]} for each segment, the shorter of the two runs meeting at
 *   the point it ends on
 */
function vertexRuns(segments) {
  const runs = segments.map((segment) => (segment.kind === 'M' ? 0 : chordLength(segment)));
  // A closepath landing on its own start point covers no distance, so it is not
  // a run and must not drag its neighbours to zero. Every circle has one.
  for (let i = 0; i < segments.length; i += 1) {
    if (segments[i].kind === 'Z' && runs[i] <= 1e-9) runs[i] = i > 0 ? runs[i - 1] : 0;
  }

  const out = new Array(segments.length).fill(0);
  let at = 0;
  while (at < segments.length) {
    let end = at + 1;
    while (end < segments.length && segments[end].kind !== 'M') end += 1;
    const body = [];
    for (let k = at + 1; k < end; k += 1) body.push(k);
    if (body.length) {
      const closed = segments[body[body.length - 1]].kind === 'Z';
      for (let n = 0; n < body.length; n += 1) {
        const here = runs[body[n]];
        const next = n + 1 < body.length ? runs[body[n + 1]] : closed ? runs[body[0]] : here;
        out[body[n]] = Math.min(here, next);
      }
      // The moveto point is the same vertex as the start of the first run, and
      // on a closed subpath the last run ends there too.
      const first = runs[body[0]];
      out[at] = Math.min(first, closed ? runs[body[body.length - 1]] : first);
    }
    at = end;
  }
  return out;
}

/**
 * Which segments belong to a subpath built from straight runs and nothing else.
 *
 * @param {import('./geometry.mjs').Segment[]} segments
 * @returns {boolean[]}
 */
function straightSubpaths(segments) {
  const out = new Array(segments.length).fill(false);
  let at = 0;
  while (at < segments.length) {
    let end = at + 1;
    while (end < segments.length && segments[end].kind !== 'M') end += 1;
    let straight = true;
    for (let k = at + 1; k < end; k += 1) {
      const kind = segments[k].kind;
      if (kind === 'C' || kind === 'Q') straight = false;
    }
    for (let k = at; k < end; k += 1) out[k] = straight;
    at = end;
  }
  return out;
}

/**
 * Draws one path by hand.
 *
 * @param {string} d
 * @param {() => number} random
 * @param {{ drift: number, bow: number }} hand
 * @param {{ minX: number, minY: number, maxX: number, maxY: number }} frame
 */
export function roughen(d, random, hand, frame) {
  const segments = parsePath(d);
  const vertices = vertexRuns(segments);
  const ruled = straightSubpaths(segments);

  const clampX = (n) => round(Math.min(frame.maxX, Math.max(frame.minX, n)));
  const clampY = (n) => round(Math.min(frame.maxY, Math.max(frame.minY, n)));

  let out = '';

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    // Held to a ruler even when the rest of the icon curves, so the cross inside
    // circle-plus stays a cross.
    const amplitude = ruled[i]
      ? { drift: hand.drift * RULER_SHARE.drift, bow: hand.bow * RULER_SHARE.bow }
      : hand;
    // Proportional to the shorter run meeting here, capped by the amplitude.
    const drift = Math.min(
      amplitude.drift,
      Math.max(DRIFT_FLOOR, (vertices[i] * amplitude.drift) / SATURATION),
    );
    const wobble = () => (random() - 0.5) * 2 * drift;
    const [x, y] = segment.to;
    const [fx, fy] = segment.from;

    if (segment.kind === 'M') {
      out += `M${clampX(x + wobble())} ${clampY(y + wobble())}`;
      continue;
    }

    const dx = x - fx;
    const dy = y - fy;
    const length = Math.hypot(dx, dy);
    // How far off the chord a control point may sit. Long runs bow more than
    // short ones, and the share is capped so a short run cannot bow further
    // than it is long.
    const swing = Math.min(0.35 + Math.min(length * 0.14, 1.5), length * BOW_SHARE);
    const across = length > 1e-9 ? [-dy / length, dx / length] : [0, 0];

    if (segment.kind === 'L' || segment.kind === 'Z') {
      if (length <= 1e-9) {
        // Already sitting on its start point, so there is no direction to bow
        // along and the hand shows in the overshoot alone.
        const [ox, oy] = overshoot(segments, i, random, vertices[i], amplitude.drift);
        out +=
          `Q${clampX(fx + wobble())} ${clampY(fy + wobble())} ` +
          `${clampX(x + ox + wobble())} ${clampY(y + oy + wobble())}`;
        continue;
      }
      // A straight run is what gives a generated set away, so it bows.
      const lean = ((random() - 0.5) * 2 * amplitude.bow + (random() < 0.5 ? -0.35 : 0.35)) * swing;
      const mx = fx + dx / 2 + across[0] * lean;
      const my = fy + dy / 2 + across[1] * lean;
      const [ox, oy] =
        segment.kind === 'Z'
          ? overshoot(segments, i, random, vertices[i], amplitude.drift)
          : [0, 0];
      out +=
        `Q${clampX(mx)} ${clampY(my)} ` +
        `${clampX(x + ox + wobble())} ${clampY(y + oy + wobble())}`;
      continue;
    }

    if (segment.kind === 'C' || segment.kind === 'Q') {
      // Both control points move the same way across the chord, which makes the
      // curve fuller or flatter rather than wavy.
      const lean = (random() - 0.5) * 2 * amplitude.bow * swing * CURVE_SHARE;
      const tension = 1 + (random() - 0.5) * 2 * CURVE_TENSION * (amplitude.bow / HAND.bow);
      const push = (point, anchor) => [
        anchor[0] + (point[0] - anchor[0]) * tension + across[0] * lean + wobble(),
        anchor[1] + (point[1] - anchor[1]) * tension + across[1] * lean + wobble(),
      ];

      if (segment.kind === 'C') {
        const [c1, c2] = segment.control;
        const [ax, ay] = push(c1, [fx, fy]);
        const [bx, by] = push(c2, [x, y]);
        out +=
          `C${clampX(ax)} ${clampY(ay)} ${clampX(bx)} ${clampY(by)} ` +
          `${clampX(x + wobble())} ${clampY(y + wobble())}`;
        continue;
      }

      const [c1] = segment.control;
      const [ax, ay] = push(c1, [fx + dx / 2, fy + dy / 2]);
      out += `Q${clampX(ax)} ${clampY(ay)} ${clampX(x + wobble())} ${clampY(y + wobble())}`;
    }
  }

  return out;
}

/**
 * How far past its start point a closing stroke carries, along the direction the
 * pen is travelling as it arrives. Signed, so it sometimes falls short instead.
 *
 * @param {import('./geometry.mjs').Segment[]} segments
 * @param {number} at the index of the closepath
 * @param {() => number} random
 * @param {number} run the shorter run meeting at the point being closed on
 * @param {number} drift the amplitude in force on this subpath
 */
function overshoot(segments, at, random, run, drift) {
  const previous = segments[at - 1];
  if (!previous) return [0, 0];
  // Where the pen was heading from: the last control point, or the start of the
  // run when there is none.
  const tail = previous.control?.[previous.control.length - 1] ?? previous.from;
  const [x, y] = segments[at].to;
  const dx = x - tail[0];
  const dy = y - tail[1];
  const length = Math.hypot(dx, dy);
  if (length <= 1e-9) return [0, 0];
  // Bounded by the run it closes on, so a tiny subpath is not carried past itself.
  const reach = Math.min(drift * OVERSHOOT_SHARE, run * 0.35) * ((random() - 0.5) * 2);
  return [(dx / length) * reach, (dy / length) * reach];
}
