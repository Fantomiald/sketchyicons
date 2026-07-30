// The tuning sheet redraws in the browser while two sliders move, so the
// roughener runs there as an inlined script. If that copy drifted from the one
// the generator uses, the file the sheet exports would describe a drawing nobody
// has seen. So both are run over the whole catalogue and compared.

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { browserRoughener } from '../tools/lib/browser.mjs';
import { elementToPath } from '../tools/lib/geometry.mjs';
import { makeRandom, handFor, frameFor, roughen } from '../tools/lib/roughen.mjs';

const nodes = JSON.parse(readFileSync('node_modules/lucide-static/icon-nodes.json', 'utf8'));
const names = Object.keys(nodes).sort();

const inBrowser = new Function(
  `${browserRoughener()}
  return { elementToPath, makeRandom, handFor, frameFor, roughen, HAND, RULER };`,
)();

const draw = (api, name, over) => {
  const source = nodes[name].map(api.elementToPath);
  const base = api.handFor(source);
  const hand = { ...base, drift: over?.drift ?? base.drift, bow: over?.bow ?? base.bow };
  const frame = api.frameFor(source);
  const random = api.makeRandom(over?.seed ? `${name}#${over.seed}` : name);
  return source.map((path) => api.roughen(path.d, random, hand, frame));
};

const here = { elementToPath, makeRandom, handFor, frameFor, roughen };

describe('the inlined roughener', () => {
  it('exposes the same amplitudes', () => {
    expect(inBrowser.HAND).toEqual(
      handFor([{ d: 'M0 0C1 1 2 2 3 3' }]).drift ? inBrowser.HAND : null,
    );
    expect(inBrowser.HAND.drift).toBe(handFor([{ d: 'M0 0C1 1 2 2 3 3' }]).drift);
    expect(inBrowser.HAND.bow).toBe(handFor([{ d: 'M0 0C1 1 2 2 3 3' }]).bow);
  });

  it('draws all 1756 icons exactly as the generator does', () => {
    const differences = [];
    for (const name of names) {
      const a = draw(here, name).join('|');
      const b = draw(inBrowser, name).join('|');
      if (a !== b) differences.push(name);
    }
    expect(differences).toEqual([]);
  });

  it('agrees under an override too', () => {
    const overrides = [
      { drift: 0.2, bow: 0.4 },
      { drift: 1.1, bow: 2.6 },
      { seed: 4 },
      { drift: 0.85, bow: 1.9, seed: 12 },
    ];
    for (const name of ['cloud', 'house', 'circle-plus', 'chevron-down', 'rabbit']) {
      for (const over of overrides) {
        expect(draw(inBrowser, name, over), `${name} ${JSON.stringify(over)}`).toEqual(
          draw(here, name, over),
        );
      }
    }
  });
});
