// Reading SVG geometry: Lucide's elements in, a flat list of absolute segments
// out. Everything downstream, the roughener, the validator and the measurement
// pass, works on that list rather than on the string.

/**
 * A number in a path, anchored so the scanner can advance one at a time.
 *
 * SVG lets numbers run together when the decimal point separates them: "3.5.7"
 * is 3.5 then 0.7, and ".6.4" is 0.6 then 0.4. A greedy digits-and-dots class eats both into
 * one token, which becomes NaN, which react-native-svg reports as an invalid
 * number and then draws nothing at all. Lucide uses this form.
 */
const NUMBER = /[-+]?(?:\d+\.\d*|\.\d+|\d+)(?:[eE][-+]?\d+)?/y;

/** How many numbers each path command takes. */
export const ARITY = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 };

const KAPPA = 0.5522847498307936;

/**
 * An elliptical arc as cubic beziers.
 *
 * Arcs are read as curves rather than kept as arcs because an arc cannot take a
 * hand. Its shape lives in rx and ry, and nudging either turns a smooth sweep
 * into a kink, so an arc could only ever have its endpoints drifted. That would
 * be a detail if Lucide used a few, but 20 percent of the catalogue's drawn
 * length is arcs and 972 of its 1756 icons carry all their curvature that way:
 * cloud, fish and flame among them, which came out of the generator looking like
 * the original with a tremble.
 *
 * A bezier has no radii to protect, so it bows like any other curve. The
 * approximation is exact at both ends and within a few ten thousandths of the
 * radius in between, well under the two decimals the output is rounded to.
 *
 * Follows the SVG 1.1 endpoint to centre conversion, F.6.5 and F.6.6.
 *
 * @param {[number, number]} from
 * @param {{ rx: number, ry: number, rotation: number, large: number, sweep: number }} arc
 * @param {[number, number]} to
 * @returns {{ control: [number, number][], to: [number, number] }[]}
 */
export function arcToCubics(from, arc, to) {
  const [x1, y1] = from;
  const [x2, y2] = to;
  // An arc that ends where it began draws nothing at all.
  if (x1 === x2 && y1 === y2) return [];

  let { rx, ry } = arc;
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  // A radius of zero makes it a straight line, which a single flat cubic is.
  if (rx === 0 || ry === 0) {
    return [
      {
        control: [
          [x1 + (x2 - x1) / 3, y1 + (y2 - y1) / 3],
          [x1 + (2 * (x2 - x1)) / 3, y1 + (2 * (y2 - y1)) / 3],
        ],
        to: [x2, y2],
      },
    ];
  }

  const phi = (arc.rotation * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  // Into the ellipse's own frame.
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const ax = cosPhi * dx + sinPhi * dy;
  const ay = -sinPhi * dx + cosPhi * dy;

  // Radii too small to reach both ends are scaled up until they reach, F.6.6.
  const reach = (ax * ax) / (rx * rx) + (ay * ay) / (ry * ry);
  if (reach > 1) {
    const grow = Math.sqrt(reach);
    rx *= grow;
    ry *= grow;
  }

  const numerator = rx * rx * ry * ry - rx * rx * ay * ay - ry * ry * ax * ax;
  const denominator = rx * rx * ay * ay + ry * ry * ax * ax;
  const scale =
    (arc.large === arc.sweep ? -1 : 1) * Math.sqrt(Math.max(0, numerator) / denominator);
  const cx1 = (scale * rx * ay) / ry;
  const cy1 = (-scale * ry * ax) / rx;

  const cx = cosPhi * cx1 - sinPhi * cy1 + (x1 + x2) / 2;
  const cy = sinPhi * cx1 + cosPhi * cy1 + (y1 + y2) / 2;

  const angleOf = (ux, uy) => Math.atan2(uy, ux);
  const start = angleOf((ax - cx1) / rx, (ay - cy1) / ry);
  const end = angleOf((-ax - cx1) / rx, (-ay - cy1) / ry);
  let sweepAngle = end - start;
  if (!arc.sweep && sweepAngle > 0) sweepAngle -= 2 * Math.PI;
  else if (arc.sweep && sweepAngle < 0) sweepAngle += 2 * Math.PI;

  // A cubic follows a circular sweep well up to a quarter turn and badly past it.
  const pieces = Math.max(1, Math.ceil(Math.abs(sweepAngle) / (Math.PI / 2)));
  const step = sweepAngle / pieces;
  const alpha = (4 / 3) * Math.tan(step / 4);

  const at = (angle) => {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    return [
      cosPhi * rx * cosA - sinPhi * ry * sinA + cx,
      sinPhi * rx * cosA + cosPhi * ry * sinA + cy,
    ];
  };
  const slope = (angle) => {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    return [-cosPhi * rx * sinA - sinPhi * ry * cosA, -sinPhi * rx * sinA + cosPhi * ry * cosA];
  };

  const out = [];
  for (let piece = 0; piece < pieces; piece += 1) {
    const a = start + piece * step;
    const b = a + step;
    const [px, py] = at(a);
    const [qx, qy] = at(b);
    const [pdx, pdy] = slope(a);
    const [qdx, qdy] = slope(b);
    out.push({
      control: [
        [px + alpha * pdx, py + alpha * pdy],
        [qx - alpha * qdx, qy - alpha * qdy],
      ],
      // The last piece lands on the point the path asked for, not on the one the
      // trigonometry arrived at.
      to: piece === pieces - 1 ? [x2, y2] : [qx, qy],
    });
  }
  return out;
}

/**
 * Segments after parsing. H and V become L, S becomes C and T becomes Q, with
 * the implied control point written out.
 *
 * Making the smooth commands explicit is not tidying. The roughener rewrites
 * straight runs as quadratics, so an S or a T that followed a line in the
 * source would reflect against a control point that did not exist before, and
 * the curve would change shape. Twenty two icons in Lucide 1.27 write an s
 * straight after a moveto, smile-plus among them.
 *
 * An arc becomes cubics too, because an arc's shape lives in its radii and those
 * cannot be nudged without kinking it. See arcToCubics.
 *
 * @typedef {{ kind: 'M' | 'L' | 'C' | 'Q' | 'Z', from: [number, number],
 *   to: [number, number], control?: [number, number][] }} Segment
 */

/**
 * Walks a path the way a renderer does and returns absolute segments.
 *
 * @param {string} d
 * @returns {Segment[]}
 */
export function parsePath(d) {
  /** @type {Segment[]} */
  const out = [];
  let at = 0;
  let command = '';
  let previous = '';
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;

  const skip = () => {
    while (at < d.length && (d[at] === ' ' || d[at] === ',' || d[at] === '\n' || d[at] === '\t')) {
      at += 1;
    }
  };
  const number = () => {
    skip();
    NUMBER.lastIndex = at;
    const match = NUMBER.exec(d);
    if (!match || match.index !== at) throw new Error(`expected a number at ${at} in path: ${d}`);
    at = NUMBER.lastIndex;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) throw new Error(`not a number at ${at} in path: ${d}`);
    return value;
  };
  /**
   * An arc flag is one character wide, and SVG lets it butt straight against
   * what follows: "a2 2 0 001.999-2" is large 0, sweep 0, x 1.999. Reading it
   * as a number swallows three values at once and every arc after it lands
   * somewhere else. 20 icons in Lucide 1.27 are written this way.
   */
  const flag = () => {
    skip();
    if (d[at] === '0' || d[at] === '1') {
      const value = Number(d[at]);
      at += 1;
      return value;
    }
    throw new Error(`expected an arc flag at ${at} in path: ${d}`);
  };
  const letter = () => {
    skip();
    return at < d.length && /[A-Za-z]/.test(d[at]) ? d[at++] : '';
  };
  const more = () => {
    skip();
    return at < d.length;
  };

  while (more()) {
    const found = letter();
    if (found) command = found;
    else if (!command) throw new Error(`path does not start with a command: ${d}`);
    const lower = command.toLowerCase();
    if (ARITY[lower] === undefined) throw new Error(`unknown command "${command}" in path: ${d}`);
    const relative = command === lower && lower !== 'z';
    const from = /** @type {[number, number]} */ ([x, y]);

    if (lower === 'z') {
      out.push({ kind: 'Z', from, to: [startX, startY] });
      x = startX;
      y = startY;
      previous = 'z';
      // Nothing repeats a closepath, so a number here is a malformed path and
      // not an implicit command. Reading it as one would spin forever.
      if (more() && !/[A-Za-z]/.test(d[at])) {
        throw new Error(`a number follows a closepath in path: ${d}`);
      }
      continue;
    }

    if (lower === 'm') {
      x = relative ? x + number() : number();
      y = relative ? y + number() : number();
      startX = x;
      startY = y;
      out.push({ kind: 'M', from, to: [x, y] });
      // What follows a moveto without its own letter is a lineto, in the same
      // case. Lucide relies on this constantly: "M12 7v14", "m2 2 20 20".
      command = relative ? 'l' : 'L';
      previous = 'm';
      continue;
    }

    if (lower === 'l' || lower === 'h' || lower === 'v') {
      if (lower === 'h') x = relative ? x + number() : number();
      else if (lower === 'v') y = relative ? y + number() : number();
      else {
        x = relative ? x + number() : number();
        y = relative ? y + number() : number();
      }
      out.push({ kind: 'L', from, to: [x, y] });
      previous = lower;
      continue;
    }

    if (lower === 'c' || lower === 's') {
      /** @type {[number, number]} */
      let c1;
      if (lower === 's') {
        // The first control point mirrors the previous one, but only when the
        // previous command was itself a cubic. Otherwise it is the current point.
        const last = out[out.length - 1];
        c1 =
          previous === 'c' && last?.control
            ? [2 * x - last.control[1][0], 2 * y - last.control[1][1]]
            : [x, y];
      } else {
        c1 = [relative ? x + number() : number(), relative ? y + number() : number()];
      }
      const c2 = /** @type {[number, number]} */ ([
        relative ? x + number() : number(),
        relative ? y + number() : number(),
      ]);
      const nx = relative ? x + number() : number();
      const ny = relative ? y + number() : number();
      out.push({ kind: 'C', from, to: [nx, ny], control: [c1, c2] });
      x = nx;
      y = ny;
      previous = 'c';
      continue;
    }

    if (lower === 'q' || lower === 't') {
      /** @type {[number, number]} */
      let c1;
      if (lower === 't') {
        const last = out[out.length - 1];
        c1 =
          previous === 'q' && last?.control
            ? [2 * x - last.control[0][0], 2 * y - last.control[0][1]]
            : [x, y];
      } else {
        c1 = [relative ? x + number() : number(), relative ? y + number() : number()];
      }
      const nx = relative ? x + number() : number();
      const ny = relative ? y + number() : number();
      out.push({ kind: 'Q', from, to: [nx, ny], control: [c1] });
      x = nx;
      y = ny;
      previous = 'q';
      continue;
    }

    // lower === 'a', read as cubics so the roughener can bow it
    const rx = number();
    const ry = number();
    const rotation = number();
    const large = flag();
    const sweep = flag();
    const nx = relative ? x + number() : number();
    const ny = relative ? y + number() : number();
    let head = /** @type {[number, number]} */ ([x, y]);
    for (const piece of arcToCubics(head, { rx, ry, rotation, large, sweep }, [nx, ny])) {
      out.push({ kind: 'C', from: head, to: piece.to, control: piece.control });
      head = piece.to;
    }
    x = nx;
    y = ny;
    previous = 'c';
  }

  return out;
}

/**
 * The straight line distance a segment covers. This is the number the drift
 * heuristic is measured against: a coordinate cannot wander further than the
 * run it belongs to and still be the shape it was.
 *
 * @param {Segment} segment
 */
export function chordLength(segment) {
  const [ax, ay] = segment.from;
  const [bx, by] = segment.to;
  return Math.hypot(bx - ax, by - ay);
}

// Lucide's elements are not all paths, and some icons contain nothing else.

/**
 * @param {Record<string, string>} attributes
 * @param {string} key
 */
const num = (attributes, key) => {
  const value = attributes[key];
  return value === undefined ? undefined : Number(value);
};

/**
 * Turns one Lucide element into a path, keeping the attributes that change what
 * is drawn. A circle becomes four cubics, a rounded rect keeps its corners.
 *
 * @param {[string, Record<string, string>]} element
 * @returns {{ d: string, fill?: string }}
 */
export function elementToPath([kind, attributes]) {
  const fill = attributes.fill;

  if (kind === 'path') return fill ? { d: attributes.d, fill } : { d: attributes.d };

  if (kind === 'circle' || kind === 'ellipse') {
    const cx = num(attributes, 'cx');
    const cy = num(attributes, 'cy');
    const rx = kind === 'circle' ? num(attributes, 'r') : num(attributes, 'rx');
    const ry = kind === 'circle' ? num(attributes, 'r') : num(attributes, 'ry');
    const kx = rx * KAPPA;
    const ky = ry * KAPPA;
    const d =
      `M${cx} ${cy - ry}` +
      `C${cx + kx} ${cy - ry} ${cx + rx} ${cy - ky} ${cx + rx} ${cy}` +
      `C${cx + rx} ${cy + ky} ${cx + kx} ${cy + ry} ${cx} ${cy + ry}` +
      `C${cx - kx} ${cy + ry} ${cx - rx} ${cy + ky} ${cx - rx} ${cy}` +
      `C${cx - rx} ${cy - ky} ${cx - kx} ${cy - ry} ${cx} ${cy - ry}Z`;
    return fill ? { d, fill } : { d };
  }

  if (kind === 'line') {
    const d = `M${num(attributes, 'x1')} ${num(attributes, 'y1')}L${num(attributes, 'x2')} ${num(attributes, 'y2')}`;
    return { d };
  }

  if (kind === 'rect') {
    const x = num(attributes, 'x') ?? 0;
    const y = num(attributes, 'y') ?? 0;
    const w = num(attributes, 'width');
    const h = num(attributes, 'height');
    // A rect with only rx takes the same ry, and the other way round. 396 of
    // Lucide's 397 rects are rounded, so squaring the corners here would show
    // on every framed icon in the set.
    let rx = num(attributes, 'rx') ?? num(attributes, 'ry') ?? 0;
    let ry = num(attributes, 'ry') ?? num(attributes, 'rx') ?? 0;
    rx = Math.min(rx, w / 2);
    ry = Math.min(ry, h / 2);
    if (rx === 0 || ry === 0) {
      return { d: `M${x} ${y}H${x + w}V${y + h}H${x}Z` };
    }
    const d =
      `M${x + rx} ${y}` +
      `H${x + w - rx}` +
      `A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}` +
      `V${y + h - ry}` +
      `A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}` +
      `H${x + rx}` +
      `A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}` +
      `V${y + ry}` +
      `A${rx} ${ry} 0 0 1 ${x + rx} ${y}` +
      `Z`;
    return { d };
  }

  if (kind === 'polyline' || kind === 'polygon') {
    const pairs = attributes.points
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    let d = `M${pairs[0]} ${pairs[1]}`;
    for (let i = 2; i < pairs.length; i += 2) d += `L${pairs[i]} ${pairs[i + 1]}`;
    return { d: kind === 'polygon' ? `${d}Z` : d };
  }

  throw new Error(`unsupported element "${kind}"`);
}

/**
 * The box the source geometry occupies, endpoints and control points included.
 * The validator measures the drawn version against this rather than against the
 * viewBox, because Lucide itself puts geometry outside the frame: save-off
 * carries a stray run at x 29.5, which the renderer clips and nobody sees.
 * Clamping it into view would add a stroke that the original does not draw.
 *
 * @param {Segment[]} segments
 */
export function boundsOf(segments) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const see = ([x, y]) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  // Only the points the path names. Every from is some earlier to, apart from
  // the first one, which is the pen's 0,0 starting position and not geometry.
  for (const segment of segments) {
    see(segment.to);
    for (const point of segment.control ?? []) see(point);
  }
  return { minX, minY, maxX, maxY };
}
