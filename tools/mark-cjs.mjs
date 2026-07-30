// Marks the two output directories with the module system they hold.
//
// Every package declares "type": "module", so the CommonJS build needs its own
// marker or node reads its .js files as ESM and every require fails. Writing
// both markers rather than only the CJS one keeps the intent visible in the
// published tarball, and it is what @arethetypeswrong/cli checks for.
//
// Both markers repeat "sideEffects": false, and that repetition is the point. A
// bundler reads sideEffects from the package.json nearest the module it is
// looking at, so this file shadows the one at the package root and the flag has
// to be restated here.
//
// The generated icons also carry a pure annotation on the factory call, and with
// esbuild either one on its own is enough: with neither, importing one icon from
// the barrel pulled in all 84, 29 kB instead of 892 bytes. Both are kept because
// bundlers differ on which they honour.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2];
if (!dist) {
  console.error('pass the dist directory');
  process.exit(1);
}

const marker = (type) => `${JSON.stringify({ type, sideEffects: false }, null, 2)}\n`;

writeFileSync(join(dist, 'esm/package.json'), marker('module'));
writeFileSync(join(dist, 'cjs/package.json'), marker('commonjs'));
