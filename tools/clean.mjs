// Empties a build directory before the compiler writes into it.
//
// tsc overwrites what it emits and leaves everything else alone, so a file that
// stopped being produced stays where it is and ships. Turning source maps off
// left four of them per module in @sketchyicons/data, pointing at sources that
// are not in the tarball.

import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

const target = process.argv[2];
if (!target) {
  console.error('pass the directory to empty');
  process.exit(1);
}

// Refusing anything above the working directory, because this deletes.
const full = resolve(target);
if (!full.startsWith(resolve('.') + '/')) {
  console.error(`refusing to empty ${full}, it is not inside ${resolve('.')}`);
  process.exit(1);
}

rmSync(full, { recursive: true, force: true });
