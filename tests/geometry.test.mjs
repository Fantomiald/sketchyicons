import { describe, expect, it } from 'vitest';

import { parsePath, chordLength, elementToPath, boundsOf } from '../tools/lib/geometry.mjs';

describe('numbers that run together', () => {
  it('reads "3.5.7" as 3.5 then 0.7', () => {
    expect(parsePath('M3.5.7')[0].to).toEqual([3.5, 0.7]);
  });

  it('reads ".6.4" as 0.6 then 0.4', () => {
    expect(parsePath('M0 0L.6.4')[1].to).toEqual([0.6, 0.4]);
  });
});

describe('arc flags', () => {
  // "a2 2 0 001.999-2" is large 0, sweep 0, x 1.999, y -2. Reading the flags as
  // numbers swallows three values at once. 20 icons in Lucide 1.27 do this.
  // Arcs come back as cubics, so the endpoint is what says the flags were read
  // in the right places.
  it('reads flags butted against the coordinate that follows', () => {
    const segments = parsePath('M10 3a41 41 0 000 18');
    expect(segments.map((s) => s.kind)).toEqual(['M', 'C']);
    expect(segments[1].to).toEqual([10, 21]);
  });

  it('reads a negative coordinate straight after the sweep flag', () => {
    const segments = parsePath('M22 6a2 2 0 00-1.999-2');
    const last = segments[segments.length - 1];
    expect(last.to[0]).toBeCloseTo(20.001, 5);
    expect(last.to[1]).toBeCloseTo(4, 5);
  });

  it('refuses a flag that is not 0 or 1', () => {
    expect(() => parsePath('M0 0a2 2 0 2 1 4 4')).toThrow(/arc flag/);
  });
});

describe('implicit commands', () => {
  it('treats a coordinate pair after a moveto as a lineto', () => {
    const segments = parsePath('m2 2 20 20');
    expect(segments.map((s) => s.kind)).toEqual(['M', 'L']);
    expect(segments[1].to).toEqual([22, 22]);
  });

  it('repeats the last command for every extra coordinate group', () => {
    expect(parsePath('M12 7v14').map((s) => s.kind)).toEqual(['M', 'L']);
    expect(parsePath('M0 0L1 1 2 2 3 3').length).toBe(4);
  });
});

describe('smooth commands', () => {
  // An s straight after a moveto takes the current point as its first control
  // point. The roughener rewrites straight runs as quadratics, so leaving the s
  // implicit would let it reflect against a control point that did not exist.
  it('writes out the control point of an s that follows a moveto', () => {
    const [, first, second] = parsePath('M8 14s1.5 2 4 2 4-2 4-2');
    expect(first.kind).toBe('C');
    expect(first.control[0]).toEqual([8, 14]);
    expect(second.control[0]).toEqual([14.5, 16]);
  });

  it('reflects a t against the previous quadratic', () => {
    const [, , second] = parsePath('M0 0Q2 4 4 0T8 0');
    expect(second.kind).toBe('Q');
    expect(second.control[0]).toEqual([6, -4]);
  });
});

describe('malformed paths', () => {
  it('refuses a path that does not open with a command', () => {
    expect(() => parsePath('12 7 14')).toThrow(/does not start with a command/);
  });

  it('refuses an unknown command', () => {
    expect(() => parsePath('M0 0K4 4')).toThrow(/unknown command/);
  });

  it('refuses a number where a closepath cannot repeat', () => {
    expect(() => parsePath('M0 0L1 1Z2 2')).toThrow(/follows a closepath/);
  });
});

describe('elements that are not paths', () => {
  it('keeps the corner radius of a rounded rect', () => {
    // 396 of Lucide's 397 rects are rounded, so squaring the corners would show
    // on every framed icon in the set.
    const { d } = elementToPath(['rect', { x: '3', y: '3', width: '18', height: '18', rx: '2' }]);
    expect(d).toContain('A2 2');
    // Four rounded corners, read back as four cubics.
    expect(parsePath(d).filter((s) => s.kind === 'C').length).toBe(4);
  });

  it('takes ry for rx when only ry is given', () => {
    const { d } = elementToPath(['rect', { x: '0', y: '0', width: '10', height: '10', ry: '3' }]);
    expect(d).toContain('A3 3');
  });

  it('squares a rect with no radius', () => {
    const { d } = elementToPath(['rect', { x: '0', y: '0', width: '4', height: '4' }]);
    expect(parsePath(d).every((s) => s.kind === 'M' || s.kind === 'L' || s.kind === 'Z')).toBe(
      true,
    );
  });

  it('turns a circle into four cubics', () => {
    const { d } = elementToPath(['circle', { cx: '12', cy: '12', r: '10' }]);
    expect(parsePath(d).filter((s) => s.kind === 'C').length).toBe(4);
  });

  it('keeps the fill of a filled dot', () => {
    const path = elementToPath(['circle', { cx: '7.5', cy: '7.5', r: '.5', fill: 'currentColor' }]);
    expect(path.fill).toBe('currentColor');
  });

  it('closes a polygon and leaves a polyline open', () => {
    expect(elementToPath(['polygon', { points: '0,0 4,0 4,4' }]).d.endsWith('Z')).toBe(true);
    expect(elementToPath(['polyline', { points: '0,0 4,0 4,4' }]).d.endsWith('Z')).toBe(false);
  });
});

describe('measuring', () => {
  it('gives a zero length closepath no length', () => {
    const segments = parsePath('M0 0L4 0L4 4L0 4Z');
    expect(chordLength(segments[segments.length - 1])).toBeCloseTo(4, 5);
    expect(chordLength(parsePath('M0 0L4 0L0 0Z')[3])).toBe(0);
  });

  it('ignores the pen start position in the bounds', () => {
    // Every from is some earlier to, apart from the first, which is 0,0 and is
    // not geometry.
    expect(boundsOf(parsePath('M10 10L12 12'))).toMatchObject({
      minX: 10,
      minY: 10,
      maxX: 12,
      maxY: 12,
    });
  });
});
