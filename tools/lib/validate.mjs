// Refusing a bad path before it is written.
//
// react-native-svg does not report a malformed path. The icon does not
// appear, with no error anywhere, and finding out why is the most tedious class
// of bug in this project. So every drawn path is walked the way a renderer walks
// it, and anything odd stops the build.

import { parsePath, chordLength } from './geometry.mjs';

/** What the roughener is allowed to turn each source command into. */
const REWRITES = { M: ['M'], L: ['Q'], Z: ['Q'], C: ['C'], Q: ['Q'] };

/**
 * @param {string} name
 * @param {string} source the path as Lucide writes it
 * @param {string} drawn the path after the hand
 * @param {{ minX: number, minY: number, maxX: number, maxY: number }} frame
 * @param {number} allowance the largest distance the hand may move a coordinate,
 *   from roughen.mjs's allowanceFor
 */
export function validate(name, source, drawn, frame, allowance) {
  // parsePath throws on an unknown command, on a number that is not one, and on
  // a path that does not open with a command.
  const before = parsePath(source);
  const after = parsePath(drawn);

  if (!after.length) throw new Error(`${name}: empty path`);
  if (after[0].kind !== 'M') throw new Error(`${name}: path does not start with a moveto`);
  if (after.length !== before.length) {
    throw new Error(`${name}: ${before.length} commands in, ${after.length} out`);
  }

  // The 0.02 is two decimals of rounding, twice over.
  const slack = allowance + 0.02;

  for (let i = 0; i < after.length; i += 1) {
    const from = before[i];
    const to = after[i];

    if (!REWRITES[from.kind].includes(to.kind)) {
      throw new Error(`${name}: command ${i} went from ${from.kind} to ${to.kind}`);
    }

    const [x, y] = to.to;
    if (x < frame.minX - 0.01 || x > frame.maxX + 0.01) {
      throw new Error(`${name}: the pen leaves the frame at x ${x}`);
    }
    if (y < frame.minY - 0.01 || y > frame.maxY + 0.01) {
      throw new Error(`${name}: the pen leaves the frame at y ${y}`);
    }

    // The point that matters: a coordinate must still be the coordinate it was.
    // A drift larger than the hand allows means an element moved somewhere else,
    // which is the failure this whole heuristic exists to prevent.
    const moved = Math.hypot(x - from.to[0], y - from.to[1]);
    if (moved > slack) {
      throw new Error(
        `${name}: command ${i} moved ${moved.toFixed(2)} units, more than the ${slack.toFixed(2)} allowed`,
      );
    }

    // A run must not be shorter than the drift that was applied to it, or the
    // two ends have swapped and the segment points the other way.
    const length = chordLength(to);
    const original = chordLength(from);
    if (original > slack && length < original / 4) {
      throw new Error(
        `${name}: run ${i} collapsed from ${original.toFixed(2)} to ${length.toFixed(2)}`,
      );
    }
  }
}
