// Drives the contact sheet the way a person does: click a verdict, type a note,
// press copy, and read what landed in the clipboard.
//
// The page script is built inside a template literal, so it is one bad escape
// away from not parsing at all, which looks exactly like nothing being wired up.
// A syntax check alone would not have caught a card missing the name the review
// is keyed on.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Window } from 'happy-dom';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let html = '';
let script = '';
let scratch = '';

beforeAll(() => {
  scratch = mkdtempSync(join(tmpdir(), 'sketchy-review-'));
  execFileSync('node', ['tools/build-preview.mjs', '--out', scratch, '--split', '40'], {
    stdio: 'pipe',
  });
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
  window.document.write(`<!doctype html><html><head></head><body>${html}</body></html>`);
  await window.happyDOM.waitUntilComplete();
  // happy-dom builds the markup but does not run a script written this way, so
  // the page script is evaluated in the window on purpose. That it parses at all
  // is asserted separately, in preview.test.mjs.
  window.eval(script);
  return { window, document: window.document, copied };
}

const cardFor = (document, name) => document.querySelector(`.card[data-name="${name}"]`);
const verdict = (card, which) => card.querySelector(`.tag-btn[data-verdict="${which}"]`);

describe('marking an icon', () => {
  it('presses in and flags the card', async () => {
    const { document } = await open();
    const card = cardFor(document, 'accessibility');
    expect(card).toBeTruthy();

    const button = verdict(card, 'liberer');
    expect(button.getAttribute('aria-pressed')).toBe('false');

    button.click();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(card.classList.contains('flagged')).toBe(true);
  });

  it('presses out when clicked again', async () => {
    const { document } = await open();
    const card = cardFor(document, 'accessibility');
    verdict(card, 'liberer').click();
    verdict(card, 'liberer').click();
    expect(verdict(card, 'liberer').getAttribute('aria-pressed')).toBe('false');
    expect(card.classList.contains('flagged')).toBe(false);
  });

  it('keeps one verdict per icon', async () => {
    const { document } = await open();
    const card = cardFor(document, 'accessibility');
    verdict(card, 'liberer').click();
    verdict(card, 'calmer').click();
    expect(verdict(card, 'liberer').getAttribute('aria-pressed')).toBe('false');
    expect(verdict(card, 'calmer').getAttribute('aria-pressed')).toBe('true');
  });

  it('marks on a note alone', async () => {
    const { document } = await open();
    const card = cardFor(document, 'accessibility');
    const note = card.querySelector('.note');
    note.value = 'la patte est molle';
    note.dispatchEvent(new document.defaultView.Event('input', { bubbles: true }));
    expect(card.classList.contains('flagged')).toBe(true);
  });

  it('touches no other card', async () => {
    const { document } = await open();
    verdict(cardFor(document, 'accessibility'), 'calmer').click();
    const flagged = [...document.querySelectorAll('.card.flagged')].map((c) => c.dataset.name);
    expect(flagged).toEqual(['accessibility']);
  });
});

describe('the report', () => {
  it('carries the name, the verdict and the note', async () => {
    const { document, copied } = await open();
    const card = cardFor(document, 'accessibility');
    verdict(card, 'redessiner').click();
    const note = card.querySelector('.note');
    note.value = 'le tirage a raté';
    note.dispatchEvent(new document.defaultView.Event('input', { bubbles: true }));

    document.getElementById('copy').click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(copied).toHaveLength(1);
    const [text] = copied;
    expect(text).toContain('# sketchyicons, retour de relecture');
    expect(text).toContain('lucide 1.27.0');
    expect(text).toMatch(/accessibility\s+\| redessiner\s+\| le tirage a raté/);
    // Real line breaks, not the two characters backslash n.
    expect(text.split('\n').length).toBeGreaterThan(4);
    expect(text).not.toContain(String.raw`\n`);
  });

  it('says so rather than copying nothing', async () => {
    const { document, copied } = await open();
    const copy = document.getElementById('copy');
    copy.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(copied).toHaveLength(0);
    expect(copy.textContent).toBe('rien de marqué');
  });
});

describe('the filters', () => {
  it('shows only what is marked', async () => {
    const { document } = await open();
    verdict(cardFor(document, 'accessibility'), 'calmer').click();
    document.querySelector('[data-filter="flagged"]').click();
    const shown = [...document.querySelectorAll('.card')].filter((card) => !card.hidden);
    expect(shown.map((card) => card.dataset.name)).toEqual(['accessibility']);
  });

  it('finds an icon by a name lucide has renamed', async () => {
    const { document } = await open();
    const search = document.getElementById('q');
    search.value = 'airplay';
    search.dispatchEvent(new document.defaultView.Event('input', { bubbles: true }));
    const shown = [...document.querySelectorAll('.card')].filter((card) => !card.hidden);
    expect(shown.length).toBeGreaterThan(0);
    expect(shown.every((card) => card.dataset.search.includes('airplay'))).toBe(true);
  });
});
