// Generates every package from packages/data/icons.
//
// Nothing inside a package is written by hand except its runtime: the factory
// that turns geometry into a component, and the types. Changing a prop is one
// file, never 1756.
//
//   node tools/build-targets.mjs                    every target
//   node tools/build-targets.mjs --target react     one target
//
// Adding a framework is one file under tools/targets and one entry below.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { ROOT, readIcons } from './lib/icons.mjs';
import data from './targets/data.mjs';
import staticFiles from './targets/static.mjs';
import react from './targets/react.mjs';
import reactNative from './targets/react-native.mjs';
import vue from './targets/vue.mjs';
import vanilla from './targets/vanilla.mjs';

const TARGETS = [data, staticFiles, react, reactNative, vue, vanilla];

const at = process.argv.indexOf('--target');
const wanted = at > -1 ? process.argv[at + 1] : null;
const targets = wanted ? TARGETS.filter((target) => target.name === wanted) : TARGETS;

if (!targets.length) {
  console.error(`unknown target "${wanted}", pick one of ${TARGETS.map((t) => t.name).join(' ')}`);
  process.exit(1);
}

const icons = readIcons();

for (const target of targets) {
  const base = join(ROOT, target.package);
  // Generated directories are wiped rather than merged, so an icon Lucide has
  // dropped does not linger in a published package.
  for (const stale of target.clean ?? ['src/icons']) {
    rmSync(join(base, stale), { recursive: true, force: true });
  }

  const files = target.files(icons);
  for (const file of files) {
    const full = join(base, file.path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, file.content);
  }
  console.log(`${target.name}: ${files.length} files from ${icons.length} icons`);
}
