// Drives the one at a time tuning sheet the way a long review session does:
// move a slider, walk to the next icon, come back, reload, and check nothing was
// lost and the exported file reproduces what was on screen.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Window } from 'happy-dom';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { elementToPath } from '../tools/lib/geometry.mjs';
import { HAND, makeRandom, handFor, frameFor, roughen } from '../tools/lib/roughen.mjs';

const nodes = JSON.parse(readFileSync('node_modules/lucide-static/icon-nodes.json', 'utf8'));
const names = Object.keys(nodes).sort();

let html = '';
let script = '';
let scratch = '';

beforeAll(() => {
  scratch = mkdtempSync(join(tmpdir(), 'sketchy-focus-'));
  execFileSync('node', ['tools/build-tuner.mjs', '--out', scratch], { stdio: 'pipe' });
  html = readFileSync(join(scratch, 'index.html'), 'utf8');
  script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
});

afterAll(() => rmSync(scratch, { recursive: true, force: true }));

/** A window that keeps its storage, so a reload can be tested. */
function makeStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => void map.set(key, String(value)),
    removeItem: (key) => void map.delete(key),
    clear: () => map.clear(),
    key: (n) => [...map.keys()][n] ?? null,
    get length() {
      return map.size;
    },
  };
}

async function open(storage = makeStorage()) {
  const window = new Window({ url: 'https://sketchyicons.test/' });
  const copied = [];
  Object.defineProperty(window.navigator, 'clipboard', {
    value: { writeText: async (text) => void copied.push(text) },
    configurable: true,
  });
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
  window.document.write(`<!doctype html><html><head></head><body>${html}</body></html>`);
  await window.happyDOM.waitUntilComplete();
  window.eval(script);
  return { window, document: window.document, copied, storage };
}

const el = (document, id) => document.getElementById(id);
const fire = (document, node, type = 'input') =>
  node.dispatchEvent(new document.defaultView.Event(type, { bubbles: true }));
const key = (document, init) =>
  document.dispatchEvent(
    new document.defaultView.KeyboardEvent('keydown', { bubbles: true, ...init }),
  );

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

describe('one icon at a time', () => {
  it('opens on the first one, drawn as the generator would', async () => {
    const { document } = await open();
    expect(el(document, 'name').textContent).toBe(names[0]);
    const drawn = el(document, 'hero-new').innerHTML;
    for (const d of drawHere(names[0], HAND)) {
      expect(drawn).toContain(`d="${d}"`);
    }
    expect(el(document, 'hero-src').innerHTML).toContain('<path');
  });

  it('shows the three sizes that matter, twice', async () => {
    const { document } = await open();
    for (const id of ['strip-src', 'strip-new']) {
      const sizes = [...el(document, id).querySelectorAll('small')].map((n) => n.textContent);
      expect(sizes).toEqual(['15', '20', '24']);
    }
  });

  it('walks with the arrow keys', async () => {
    const { document } = await open();
    key(document, { key: 'ArrowRight' });
    expect(el(document, 'name').textContent).toBe(names[1]);
    key(document, { key: 'ArrowLeft' });
    expect(el(document, 'name').textContent).toBe(names[0]);
  });

  it('counts an icon as seen once you leave it', async () => {
    const { document } = await open();
    expect(el(document, 'seen').textContent).toBe('0');
    key(document, { key: 'ArrowRight' });
    expect(el(document, 'seen').textContent).toBe('1');
    expect(el(document, 'fill').style.width).not.toBe('0%');
  });

  it('jumps to the next one nobody has looked at', async () => {
    const { document } = await open();
    // there and back, so the first three have all been left at least once
    key(document, { key: 'ArrowRight' });
    key(document, { key: 'ArrowRight' });
    key(document, { key: 'ArrowLeft' });
    key(document, { key: 'ArrowLeft' });
    expect(el(document, 'seen').textContent).toBe('3');
    el(document, 'unseen').click();
    expect(el(document, 'name').textContent).toBe(names[3]);
  });
});

describe('tuning', () => {
  it('redraws on the slider and marks the icon', async () => {
    const { document } = await open();
    const before = el(document, 'hero-new').innerHTML;
    const drift = el(document, 'drift');
    drift.value = '0.25';
    fire(document, drift);

    expect(el(document, 'hero-new').innerHTML).not.toBe(before);
    expect(el(document, 'badge').hidden).toBe(false);
    expect(el(document, 'drift-off').textContent).toBe('propre');
    for (const d of drawHere(names[0], HAND, { drift: 0.25 })) {
      expect(el(document, 'hero-new').innerHTML).toContain(`d="${d}"`);
    }
  });

  it('nudges with the arrow keys, bow with shift', async () => {
    const { document } = await open();
    key(document, { key: 'ArrowUp' });
    expect(el(document, 'drift-out').textContent).toBe((HAND.drift + 0.02).toFixed(2));
    key(document, { key: 'ArrowDown', shiftKey: true });
    expect(el(document, 'bow-out').textContent).toBe((HAND.bow - 0.05).toFixed(2));
  });

  it('puts it back on remettre', async () => {
    const { document } = await open();
    const before = el(document, 'hero-new').innerHTML;
    key(document, { key: 'ArrowUp' });
    expect(el(document, 'hero-new').innerHTML).not.toBe(before);
    key(document, { key: '0' });
    expect(el(document, 'hero-new').innerHTML).toBe(before);
    expect(el(document, 'badge').hidden).toBe(true);
  });

  it('keeps a tuning on the icon it was made on', async () => {
    const { document } = await open();
    const drift = el(document, 'drift');
    drift.value = '0.2';
    fire(document, drift);
    key(document, { key: 'ArrowRight' });
    expect(el(document, 'badge').hidden).toBe(true);
    expect(el(document, 'drift-out').textContent).toBe('0.60');
    key(document, { key: 'ArrowLeft' });
    expect(el(document, 'badge').hidden).toBe(false);
    expect(el(document, 'drift-out').textContent).toBe('0.20');
  });
});

describe('nothing is lost', () => {
  it('survives a reload, tuning and position and progress', async () => {
    const storage = makeStorage();
    const first = await open(storage);
    const drift = el(first.document, 'drift');
    drift.value = '0.33';
    fire(first.document, drift);
    key(first.document, { key: 'ArrowRight' });
    key(first.document, { key: 'ArrowRight' });

    // the tab goes away without anyone pressing anything
    const again = await open(storage);
    expect(el(again.document, 'name').textContent).toBe(names[2]);
    expect(el(again.document, 'seen').textContent).toBe('2');
    expect(el(again.document, 'count').textContent).toBe('1');
    key(again.document, { key: 'ArrowLeft' });
    key(again.document, { key: 'ArrowLeft' });
    expect(el(again.document, 'drift-out').textContent).toBe('0.33');
  });

  it('writes on every change, not on leaving the icon', async () => {
    const { document, storage } = await open();
    const drift = el(document, 'drift');
    drift.value = '0.44';
    fire(document, drift);
    const saved = JSON.parse(storage.getItem('sketchyicons-tuning'));
    expect(saved.icons[names[0]].drift).toBe(0.44);
  });
});

describe('the file', () => {
  it('stays up to date on screen', async () => {
    const { document } = await open();
    const drift = el(document, 'drift');
    drift.value = '0.5';
    fire(document, drift);
    const shown = JSON.parse(el(document, 'json').textContent);
    expect(shown.icons[names[0]]).toEqual({ drift: 0.5, why: 'réglée à la main' });
    expect(shown.hand).toEqual({ drift: HAND.drift, bow: HAND.bow });
  });

  it('reproduces exactly what was on screen', async () => {
    const { document, copied } = await open();
    const gbow = el(document, 'gbow');
    gbow.value = '1.9';
    fire(document, gbow);
    el(document, 'reseed').click();
    const shown = el(document, 'hero-new').innerHTML;

    el(document, 'export').click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const settings = JSON.parse(copied[0]);
    for (const d of drawHere(names[0], settings.hand, settings.icons[names[0]])) {
      expect(shown).toContain(`d="${d}"`);
    }
  });

  it('leaves the global out of the icons', async () => {
    const { document } = await open();
    const gdrift = el(document, 'gdrift');
    gdrift.value = '0.9';
    fire(document, gdrift);
    const shown = JSON.parse(el(document, 'json').textContent);
    expect(shown.hand.drift).toBe(0.9);
    expect(shown.icons).toEqual({});
  });
});

describe('nothing can lock the file in', () => {
  it('holds 1756 tuned icons and still exports them all', async () => {
    // The one way to lose a long pass would be a quota that filled up in
    // silence, so the whole catalogue is tuned and read back.
    const { storage } = await open();
    const settings = { hand: { ...HAND }, icons: {} };
    for (const name of names) {
      settings.icons[name] = { drift: 0.42, bow: 1.7, seed: 3, why: 'réglée à la main' };
    }
    storage.setItem('sketchyicons-tuning', JSON.stringify(settings));

    const again = await open(storage);
    expect(el(again.document, 'count').textContent).toBe(String(names.length));
    again.document.getElementById('export').click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const out = JSON.parse(again.copied[0]);
    expect(Object.keys(out.icons)).toHaveLength(names.length);
    expect(out.icons[names[0]]).toEqual({
      seed: 3,
      drift: 0.42,
      bow: 1.7,
      why: 'réglée à la main',
    });
  });

  it('can always be selected by hand when the clipboard is refused', async () => {
    const { document } = await open();
    const drift = el(document, 'drift');
    drift.value = '0.3';
    fire(document, drift);
    el(document, 'select').click();
    expect(document.defaultView.getSelection().toString()).toContain('"drift": 0.3');
  });

  it('shows the whole file, never a trimmed one', async () => {
    const { storage } = await open();
    const settings = { hand: { ...HAND }, icons: {} };
    for (const name of names.slice(0, 800)) settings.icons[name] = { seed: 2, why: 'x' };
    storage.setItem('sketchyicons-tuning', JSON.stringify(settings));
    const again = await open(storage);
    expect(Object.keys(JSON.parse(el(again.document, 'json').textContent).icons)).toHaveLength(800);
  });
});
