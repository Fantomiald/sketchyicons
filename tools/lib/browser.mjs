// The roughener, as one script a page can run.
//
// The tuning sheet redraws icons in the browser while two sliders move, so the
// roughener has to run there. It is inlined rather than reimplemented: what the
// sliders show has to be what `pnpm generate` writes, to the byte, or the file
// the sheet exports describes a drawing nobody has seen.
//
// tests/browser.test.mjs draws the whole catalogue both ways and compares.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ROOT } from './icons.mjs';

/** Turns an ES module into statements, keeping every line otherwise. */
const flatten = (source) =>
  source
    .replace(/^import\s[\s\S]*?from\s+'[^']+';\n/gm, '')
    .replace(/^export\s+(const|function|class|let)\s/gm, '$1 ')
    .replace(/^export\s+\{[^}]*\};?\n/gm, '');

/**
 * geometry.mjs and roughen.mjs, in dependency order, with the module syntax
 * taken out. Everything they define ends up in one scope.
 */
export function browserRoughener() {
  const files = ['tools/lib/geometry.mjs', 'tools/lib/roughen.mjs'];
  return files.map((file) => flatten(readFileSync(join(ROOT, file), 'utf8'))).join('\n');
}
