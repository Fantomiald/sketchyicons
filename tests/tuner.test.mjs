// Drives the grid tuning sheet, the one that shows the whole catalogue at once:
// move a slider, tune one icon, export, and check the file that comes out is one
// the generator accepts and reproduces. tests/focus.test.mjs does the same for
// the one at a time sheet.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Window } from 'happy-dom';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { elementToPath } from '../tools/lib/geometry.mjs';
import { makeRandom, handFor, frameFor, roughen } from '../tools/lib/roughen.mjs';

const nodes = JSON.parse(readFileSync('node_modules/lucide-static/icon-nodes.json', 'utf8'));

let html = '';
let script = '';
let scratch = '';

beforeAll(() => {
  scratch = mkdtempSync(join(tmpdir(), 'sketchy-tuner-'));
  execFileSync(
    'node',
    ['tools/build-tuner.mjs', '--mode', 'grid', '--out', scratch, '--split', '60'],
    { stdio: 'pipe' },
  );
  html = readFileSync(join(scratch, 'index.html'), 'utf8');
  script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
});

afterAll(() => rmSync(scratch, { recursive: true, force: true }));

async function open() {
  const window = new Window({ url: 'https://sketchyicons.test/' });
  const copied = [];
  Object.defineProperty(window.navigator, 'clipboard', {
    value: { writeText: async (text) => void copied.push(text) },
    configurable: true,
  });
  // happy-dom has no layout, so nothing ever reports as on screen. The sheet
  // only draws what an observer says is near the viewport, so the observer says
  // everything is.
  window.IntersectionObserver = class {
    constructor(callback) {
      this.callback = callback;
    }
    observe(target) {
      this.callback([{ target, isIntersecting: true }]);
    }
    unobserve() {}
    disconnect() {}
  };
  window.requestAnimationFrame = (fn) => window.setTimeout(fn, 0);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);
  window.document.write(`<!doctype html><html><head></head><body>${html}</body></html>`);
  await window.happyDOM.waitUntilComplete();
  window.eval(script);
  return { window, document: window.document, copied };
}

const cardFor = (document, name) => document.querySelector(`.card[data-name="${name}"]`);
const fire = (document, element, type = 'input') =>
  element.dispatchEvent(new document.defaultView.Event(type, { bubbles: true }));

const drawHere = (name, hand, over) => {
  const source = nodes[name].map(elementToPath);
  const base = handFor(source);
  const amplitude = {
    ...base,
    drift: over?.drift ?? hand.drift,
    bow: over?.bow ?? hand.bow,
  };
  const frame = frameFor(source);
  const random = makeRandom(over?.seed ? `${name}#${over.seed}` : name);
  return source.map((path) => roughen(path.d, random, amplitude, frame));
};

describe('drawing', () => {
  it('draws every card it is shown', async () => {
    const { document } = await open();
    const drawn = [...document.querySelectorAll('.card svg.drawn')].filter((svg) =>
      svg.innerHTML.includes('<path'),
    );
    expect(drawn.length).toBeGreaterThan(0);
  });

  it('draws what the generator would draw', async () => {
    const { document } = await open();
    const card = cardFor(document, 'accessibility');
    const svg = card.querySelector('svg.drawn');
    const expected = drawHere('accessibility', { drift: 0.6, bow: 1.13 });
    for (const d of expected) expect(svg.innerHTML).toContain(`d="${d}"`);
  });

  it('shows the lucide path beside it', async () => {
    const { document } = await open();
    const source = cardFor(document, 'accessibility').querySelector('svg.source');
    expect(source.innerHTML).toContain('<path');
  });
});

describe('the global knobs', () => {
  it('redraws everything when the drift moves', async () => {
    const { document } = await open();
    const card = cardFor(document, 'accessibility');
    const before = card.querySelector('svg.drawn').innerHTML;

    const drift = document.getElementById('drift');
    drift.value = '0.95';
    fire(document, drift);
    // A global change redraws on the next frame, so a drag does not redraw the
    // catalogue once per pixel.
    await new Promise((resolve) => setTimeout(resolve, 0));

    const after = card.querySelector('svg.drawn').innerHTML;
    expect(after).not.toBe(before);
    for (const d of drawHere('accessibility', { drift: 0.95, bow: 1.13 })) {
      expect(after).toContain(`d="${d}"`);
    }
  });
});

describe('tuning one icon', () => {
  it('marks the card and leaves its neighbours alone', async () => {
    const { document } = await open();
    const card = cardFor(document, 'accessibility');
    const other = cardFor(document, 'activity');
    const otherBefore = other.querySelector('svg.drawn').innerHTML;

    card.querySelector('.open').click();
    const slider = card.querySelector('.panel input[data-knob="drift"]');
    slider.value = '0.25';
    fire(document, slider);

    expect(card.classList.contains('tuned')).toBe(true);
    expect(other.classList.contains('tuned')).toBe(false);
    expect(other.querySelector('svg.drawn').innerHTML).toBe(otherBefore);
    for (const d of drawHere('accessibility', { drift: 0.6, bow: 1.13 }, { drift: 0.25 })) {
      expect(card.querySelector('svg.drawn').innerHTML).toContain(`d="${d}"`);
    }
  });

  it('draws again from another sequence on reseed', async () => {
    const { document } = await open();
    const card = cardFor(document, 'accessibility');
    const before = card.querySelector('svg.drawn').innerHTML;
    card.querySelector('.open').click();
    card.querySelector('.panel [data-act="reseed"]').click();
    expect(card.querySelector('svg.drawn').innerHTML).not.toBe(before);
    for (const d of drawHere('accessibility', { drift: 0.6, bow: 1.13 }, { seed: 1 })) {
      expect(card.querySelector('svg.drawn').innerHTML).toContain(`d="${d}"`);
    }
  });

  it('puts it back on cancel', async () => {
    const { document } = await open();
    const card = cardFor(document, 'accessibility');
    const before = card.querySelector('svg.drawn').innerHTML;
    card.querySelector('.open').click();
    const slider = card.querySelector('.panel input[data-knob="bow"]');
    slider.value = '2.4';
    fire(document, slider);
    expect(card.querySelector('svg.drawn').innerHTML).not.toBe(before);
    card.querySelector('.panel [data-act="clear"]').click();
    expect(card.classList.contains('tuned')).toBe(false);
    expect(card.querySelector('svg.drawn').innerHTML).toBe(before);
  });
});

describe('what comes out', () => {
  it('is a settings file the generator accepts', async () => {
    const { document, copied } = await open();
    const drift = document.getElementById('drift');
    drift.value = '0.72';
    fire(document, drift);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const card = cardFor(document, 'accessibility');
    card.querySelector('.open').click();
    const slider = card.querySelector('.panel input[data-knob="drift"]');
    slider.value = '0.3';
    fire(document, slider);
    const why = card.querySelector('.panel [data-why]');
    why.value = 'trop agitée';
    fire(document, why);

    document.getElementById('export').click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(copied).toHaveLength(1);
    const settings = JSON.parse(copied[0]);
    expect(settings.hand).toEqual({ drift: 0.72, bow: 1.13 });
    expect(settings.icons.accessibility).toEqual({
      drift: 0.3,
      why: 'trop agitée',
    });
    expect(Object.keys(settings.icons)).toEqual(['accessibility']);
  });

  it('reproduces exactly what the sheet showed', async () => {
    const { document, copied } = await open();
    const bow = document.getElementById('bow');
    bow.value = '2.1';
    fire(document, bow);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const card = cardFor(document, 'airplay');
    card.querySelector('.open').click();
    card.querySelector('.panel [data-act="reseed"]').click();
    const shown = card.querySelector('svg.drawn').innerHTML;

    document.getElementById('export').click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const settings = JSON.parse(copied[0]);

    // The generator, given that file, has to draw the glyph the sheet displayed.
    for (const d of drawHere('airplay', settings.hand, settings.icons.airplay)) {
      expect(shown).toContain(`d="${d}"`);
    }
  });

  it('carries a why even when nobody typed one', async () => {
    const { document, copied } = await open();
    const card = cardFor(document, 'accessibility');
    card.querySelector('.open').click();
    card.querySelector('.panel [data-act="reseed"]').click();
    document.getElementById('export').click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(JSON.parse(copied[0]).icons.accessibility.why).toBeTruthy();
  });
});
