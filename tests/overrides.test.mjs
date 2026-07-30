import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { elementToPath } from '../tools/lib/geometry.mjs';
import { makeRandom, handFor, frameFor, roughen } from '../tools/lib/roughen.mjs';

const nodes = JSON.parse(readFileSync('node_modules/lucide-static/icon-nodes.json', 'utf8'));

const draw = (name, override) => {
  const source = nodes[name].map(elementToPath);
  const measured = handFor(source);
  const hand = {
    ...measured,
    drift: override?.drift ?? measured.drift,
    bow: override?.bow ?? measured.bow,
  };
  const frame = frameFor(source);
  const random = makeRandom(override?.seed ? `${name}#${override.seed}` : name);
  return source.map((path) => roughen(path.d, random, hand, frame));
};

describe('the override escape hatch', () => {
  it('draws nothing differently when there is no override', () => {
    for (const name of ['house', 'crown', 'smile-plus', 'chevron-down']) {
      expect(draw(name, undefined)).toEqual(draw(name, {}));
    }
  });

  it('redraws the same shape from a different sequence on a new seed', () => {
    const before = draw('smile-plus');
    const after = draw('smile-plus', { seed: 2 });
    expect(after).not.toEqual(before);
    expect(after.length).toBe(before.length);
    // The shape is the same, only the throw changed, so every path still has the
    // same number of commands.
    for (let i = 0; i < before.length; i += 1) {
      expect((after[i].match(/[A-Z]/g) ?? []).length).toBe(
        (before[i].match(/[A-Z]/g) ?? []).length,
      );
    }
  });

  it('changes the amplitude on a drift override', () => {
    expect(draw('crown', { drift: 0.1 })).not.toEqual(draw('crown'));
  });

  it('touches no other icon', () => {
    // The sequence is seeded per icon, so an override on one cannot reach another.
    const others = ['house', 'star', 'heart', 'crown'];
    const before = others.map((name) => draw(name));
    draw('smile-plus', { seed: 7, drift: 0.9 });
    expect(others.map((name) => draw(name))).toEqual(before);
  });
});
