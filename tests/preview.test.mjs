import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// The contact sheet is a string built inside a template literal, so an escape
// meant for the page survives one round of interpolation before it gets there.
// One \n written as \n instead of \\n cut a string in half and the whole page
// script stopped parsing, which looks exactly like nothing being wired up.

let html = '';
let script = '';
let scratch = '';

beforeAll(() => {
  scratch = mkdtempSync(join(tmpdir(), 'sketchy-preview-'));
  execFileSync('node', ['tools/build-preview.mjs', '--out', scratch], { stdio: 'pipe' });
  html = readFileSync(join(scratch, 'index.html'), 'utf8');
  script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
});

afterAll(() => rmSync(scratch, { recursive: true, force: true }));

describe('the page script', () => {
  it('parses', () => {
    const file = join(scratch, 'page-script.mjs');
    writeFileSync(file, script);
    expect(() => execFileSync('node', ['--check', file], { stdio: 'pipe' })).not.toThrow();
  });

  it('keeps its newline escapes rather than real newlines', () => {
    const report = script.slice(script.indexOf('const report'), script.indexOf('const copy'));
    expect(report).toContain(String.raw`\n`);
  });
});

describe('the cards', () => {
  it('carry the name the review is keyed on', () => {
    const cards = html.match(/<article class="card"[^>]*>/g) ?? [];
    expect(cards.length).toBeGreaterThan(1700);
    expect(cards.every((card) => /data-name="[a-z0-9-]+"/.test(card))).toBe(true);
  });

  it('carry a verdict control and a note per icon', () => {
    const cards = (html.match(/<article class="card"/g) ?? []).length;
    expect((html.match(/class="tag-btn"/g) ?? []).length).toBe(cards * 3);
    expect((html.match(/class="note"/g) ?? []).length).toBe(cards);
  });

  it('references a symbol that exists for every glyph', () => {
    const ids = new Set([...html.matchAll(/<symbol id="([^"]+)"/g)].map((m) => m[1]));
    const refs = new Set([...html.matchAll(/<use href="#([^"]+)"/g)].map((m) => m[1]));
    expect([...refs].filter((ref) => !ids.has(ref))).toEqual([]);
  });
});
