import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { parsePath, chordLength, elementToPath } from '../tools/lib/geometry.mjs';
import {
  HAND,
  RULER,
  makeRandom,
  handFor,
  frameFor,
  roughen,
  isStraight,
  allowanceFor,
} from '../tools/lib/roughen.mjs';
import { validate } from '../tools/lib/validate.mjs';

const nodes = JSON.parse(readFileSync('node_modules/lucide-static/icon-nodes.json', 'utf8'));
const names = Object.keys(nodes).sort();

const draw = (name) => {
  const source = nodes[name].map(elementToPath);
  const hand = handFor(source);
  const frame = frameFor(source);
  const random = makeRandom(name);
  return { source, hand, frame, paths: source.map((path) => roughen(path.d, random, hand, frame)) };
};

describe('determinism', () => {
  it('draws the same glyph twice for the same name', () => {
    for (const name of ['house', 'quote', 'smile-plus', 'crown', 'chevron-down']) {
      expect(draw(name).paths).toEqual(draw(name).paths);
    }
  });

  it('draws a different glyph for a different name', () => {
    expect(draw('chevron-down').paths).not.toEqual(draw('chevron-up').paths);
  });

  it('produces byte identical output over the whole catalogue', () => {
    const once = names.map((name) => draw(name).paths.join('|')).join('\n');
    const twice = names.map((name) => draw(name).paths.join('|')).join('\n');
    expect(twice).toBe(once);
  });
});

describe('the whole catalogue is valid', () => {
  it('draws and validates all 1756 icons', () => {
    const failures = [];
    for (const name of names) {
      const { source, hand, frame, paths } = draw(name);
      for (let i = 0; i < paths.length; i += 1) {
        try {
          validate(name, source[i].d, paths[i], frame, allowanceFor(hand));
        } catch (error) {
          failures.push(error.message);
        }
      }
    }
    expect(failures).toEqual([]);
    expect(names.length).toBeGreaterThan(1700);
  });
});

describe('the length bound', () => {
  // The rule this heuristic exists for: a coordinate cannot wander further than
  // the run it belongs to and still be that run.
  it('barely moves a run far shorter than the amplitude', () => {
    // smile-plus draws its eyes as 0.01 unit lines.
    const { source, paths } = draw('smile-plus');
    for (let i = 0; i < source.length; i += 1) {
      const before = parsePath(source[i].d);
      const after = parsePath(paths[i]);
      for (let k = 0; k < before.length; k += 1) {
        const run = chordLength(before[k]);
        if (run > 0.05) continue;
        const moved = Math.hypot(
          after[k].to[0] - before[k].to[0],
          after[k].to[1] - before[k].to[1],
        );
        // A hundredth of a unit either way is the rounding, not a drawing choice.
        expect(moved).toBeLessThanOrEqual(0.02);
      }
    }
  });

  it('never moves a coordinate further than the amplitude allows', () => {
    for (const name of names) {
      const { source, hand, paths } = draw(name);
      const limit = allowanceFor(hand) + 0.02;
      for (let i = 0; i < source.length; i += 1) {
        const before = parsePath(source[i].d);
        const after = parsePath(paths[i]);
        for (let k = 0; k < before.length; k += 1) {
          const moved = Math.hypot(
            after[k].to[0] - before[k].to[0],
            after[k].to[1] - before[k].to[1],
          );
          expect(moved, `${name} command ${k}`).toBeLessThanOrEqual(limit);
        }
      }
    }
  });
});

/** How far a drawn point sits from where Lucide put it, worst case. */
const worstDrift = (name) => {
  const { source, paths } = draw(name);
  let worst = 0;
  for (let i = 0; i < source.length; i += 1) {
    const before = parsePath(source[i].d);
    const after = parsePath(paths[i]);
    for (let k = 0; k < before.length; k += 1) {
      worst = Math.max(
        worst,
        Math.hypot(after[k].to[0] - before[k].to[0], after[k].to[1] - before[k].to[1]),
      );
    }
  }
  return worst;
};

describe('the ruler bound', () => {
  it('starts every icon from the same amplitude', () => {
    // Which parts stay calm is decided per subpath, not per icon, so handFor no
    // longer picks between two amplitudes.
    for (const name of ['chevron-down', 'house', 'heart', 'circle-plus']) {
      expect(handFor(nodes[name].map(elementToPath))).toMatchObject(HAND);
    }
  });

  it('holds an icon made only of straight runs to the ruler', () => {
    for (const name of ['chevron-down', 'plus', 'x', 'hash', 'arrow-right', 'check']) {
      expect(worstDrift(name), name).toBeLessThanOrEqual(RULER.drift * Math.SQRT2 + 0.02);
    }
  });

  it('holds a straight subpath to the ruler inside an icon that curves', () => {
    // The plus inside circle-plus used to take the full amplitude because the
    // circle around it curves.
    const { source, paths } = draw('circle-plus');
    const straight = [];
    const curved = [];
    for (let i = 0; i < source.length; i += 1) {
      const before = parsePath(source[i].d);
      const after = parsePath(paths[i]);
      const isLine = before.every((segment) => segment.kind === 'M' || segment.kind === 'L');
      for (let k = 0; k < before.length; k += 1) {
        const moved = Math.hypot(
          after[k].to[0] - before[k].to[0],
          after[k].to[1] - before[k].to[1],
        );
        (isLine ? straight : curved).push(moved);
      }
    }
    expect(straight.length).toBeGreaterThan(0);
    expect(curved.length).toBeGreaterThan(0);
    expect(Math.max(...straight)).toBeLessThanOrEqual(RULER.drift * Math.SQRT2 + 0.02);
    expect(Math.max(...curved)).toBeGreaterThan(RULER.drift * Math.SQRT2);
  });

  it('reads a rounded rect as curved', () => {
    expect(
      isStraight([elementToPath(['rect', { x: '3', y: '3', width: '18', height: '18', rx: '2' }])]),
    ).toBe(false);
  });

  it('reports 159 icons drawn entirely with a ruler', () => {
    const ruler = names.filter((name) => handFor(nodes[name].map(elementToPath)).straight);
    expect(ruler.length).toBe(159);
  });
});

/**
 * Where each segment passes halfway along, which is where a bow shows and drift
 * on the endpoints does not. One entry per segment, null where there is no
 * curve, so the source and the drawn version line up: the roughener rewrites a
 * straight run as a quadratic, so dropping the non curves would shift one list
 * against the other.
 */
const midpoints = (d) =>
  parsePath(d).map((segment) => {
    if (segment.kind !== 'C' && segment.kind !== 'Q') return null;
    const points = [segment.from, ...segment.control, segment.to];
    if (points.length === 3) {
      return [0, 1].map((i) => 0.25 * points[0][i] + 0.5 * points[1][i] + 0.25 * points[2][i]);
    }
    return [0, 1].map(
      (i) =>
        0.125 * points[0][i] + 0.375 * points[1][i] + 0.375 * points[2][i] + 0.125 * points[3][i],
    );
  });

describe('curves take a hand too', () => {
  it('bows a curve away from the line Lucide drew', () => {
    // Until this, a curve took drift on its points and nothing else, so an icon
    // drawn entirely in curves came out looking like Lucide with a tremble.
    //
    // The drift is turned off to measure it. Both move the middle of a curve, and
    // the bow is signed, so on any single curve one can cancel the other: with
    // both on, circle's middle moves less than with the bow alone.
    for (const name of ['cloud', 'rabbit', 'circle', 'fish', 'flame']) {
      const source = nodes[name].map(elementToPath);
      const frame = frameFor(source);
      const bowOnly = { ...handFor(source), drift: 0 };

      let worst = 0;
      const random = makeRandom(name);
      for (const path of source) {
        const before = midpoints(path.d);
        const after = midpoints(roughen(path.d, random, bowOnly, frame));
        for (let k = 0; k < before.length; k += 1) {
          if (!before[k] || !after[k]) continue;
          worst = Math.max(
            worst,
            Math.hypot(after[k][0] - before[k][0], after[k][1] - before[k][1]),
          );
        }
      }
      expect(worst, name).toBeGreaterThan(0.1);
    }
  });

  it('leaves the middle alone when the bow is turned off', () => {
    const source = nodes['cloud'].map(elementToPath);
    const frame = frameFor(source);
    const flat = { ...handFor(source), bow: 0, drift: 0 };
    const random = makeRandom('cloud');
    for (const path of source) {
      const drawn = roughen(path.d, random, flat, frame);
      const before = midpoints(path.d);
      const after = midpoints(drawn);
      for (let k = 0; k < before.length; k += 1) {
        if (!before[k] || !after[k]) continue;
        expect(Math.hypot(after[k][0] - before[k][0], after[k][1] - before[k][1])).toBeLessThan(
          0.02,
        );
      }
    }
  });
});

describe('closing a subpath', () => {
  it('does not land exactly where it started', () => {
    // A closepath that snaps shut on its own start point is the one thing a hand
    // never does, and every circle in the catalogue did it.
    const { source, paths } = draw('circle');
    let landed = 0;
    for (let i = 0; i < source.length; i += 1) {
      const before = parsePath(source[i].d);
      const after = parsePath(paths[i]);
      for (let k = 0; k < before.length; k += 1) {
        if (before[k].kind !== 'Z') continue;
        const start = after[0].to;
        const close = after[k].to;
        if (Math.hypot(close[0] - start[0], close[1] - start[1]) < 0.01) landed += 1;
      }
    }
    expect(landed).toBe(0);
  });
});

describe('arcs', () => {
  it('are read as cubics, so nothing downstream sees an arc', () => {
    // An arc's shape lives in rx and ry, and nudging either kinks it, so an arc
    // could only ever have its endpoints drifted. 972 of the 1756 icons carry
    // all their curvature that way and came out looking like the original.
    for (const name of names) {
      const { source, paths } = draw(name);
      for (let i = 0; i < source.length; i += 1) {
        expect(parsePath(source[i].d).some((s) => s.kind === 'A')).toBe(false);
        expect(paths[i]).not.toMatch(/[Aa]/);
      }
    }
  });

  it('lands on the point the path asked for', () => {
    const [, arc] = parsePath('M22 12A10 10 0 0 1 12 22');
    expect(arc.kind).toBe('C');
    expect(arc.to).toEqual([12, 22]);
  });

  it('stays on the ellipse in between', () => {
    // The cubic approximation is what replaces the arc, so it has to be one. A
    // quarter turn is off by about three ten thousandths of the radius, well
    // under the two decimals the output is rounded to.
    const [, arc] = parsePath('M22 12A10 10 0 0 1 12 22');
    const [c1, c2] = arc.control;
    const point = (t) => {
      const u = 1 - t;
      return [0, 1].map(
        (i) =>
          u * u * u * [22, 12][i] +
          3 * u * u * t * c1[i] +
          3 * u * t * t * c2[i] +
          t * t * t * arc.to[i],
      );
    };
    for (const t of [0.25, 0.5, 0.75]) {
      const [x, y] = point(t);
      expect(Math.hypot(x - 12, y - 12)).toBeCloseTo(10, 2);
    }
  });

  it('splits a sweep wider than a quarter turn', () => {
    // One cubic follows a quarter turn well and a half turn badly.
    const half = parsePath('M22 12A10 10 0 0 1 2 12').filter((s) => s.kind === 'C');
    expect(half.length).toBeGreaterThan(1);
  });
});

describe('the frame', () => {
  it('keeps a stroke clear of the viewBox edge', () => {
    const { frame } = draw('house');
    expect(frame.minX).toBe(0.75);
    expect(frame.maxX).toBe(23.25);
  });

  it('leaves geometry that Lucide already puts outside the frame outside it', () => {
    // save-off carries a stray run at x 29.5 that the renderer clips and nobody
    // sees. Dragging it into view would add a stroke the original does not draw.
    const { frame, paths } = draw('save-off');
    expect(frame.maxX).toBeGreaterThan(30);
    const stray = paths.find((d) => parsePath(d).some((s) => s.to[0] > 25));
    expect(stray).toBeDefined();
  });
});
