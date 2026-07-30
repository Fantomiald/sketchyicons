// Removes source maps from a build output.
//
// A map that points at sources the tarball does not carry is dead weight: two
// megabytes in @sketchyicons/angular, and nothing a consumer can step through.
// ng-packagr writes them unconditionally, so they are taken out afterwards.

import { readdirSync, rmSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const target = process.argv[2];
if (!target) {
  console.error('pass the directory to clear of maps');
  process.exit(1);
}

const full = resolve(target);
if (!full.startsWith(resolve('.') + '/')) {
  console.error(`refusing to touch ${full}, it is not inside ${resolve('.')}`);
  process.exit(1);
}

let dropped = 0;
const walk = (directory) => {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (entry.endsWith('.map')) {
      rmSync(path);
      dropped += 1;
    }
  }
};
walk(full);
console.log(`dropped ${dropped} source maps from ${target}`);
