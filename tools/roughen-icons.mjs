// Turns Lucide's geometry into sketchyicons' drawn geometry.
//
// This runs once per upstream Lucide release, not on every build. It reads
// node_modules/lucide-static and writes packages/data/icons/*.json, which are
// committed and are the source of truth for every framework package.
// lucide-static is a devDependency and never ships in a published package.
//
//   node tools/roughen-icons.mjs                          the whole catalogue
//   node tools/roughen-icons.mjs --only tools/reference.json
//   node tools/roughen-icons.mjs --json /tmp/icons.json    a dump for a preview
//
// The shapes come from Lucide (ISC, (c) Lucide Icons and Contributors). The hand
// is added by tools/lib/roughen.mjs.

import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { elementToPath } from './lib/geometry.mjs';
import { HAND, makeRandom, handFor, frameFor, roughen, allowanceFor } from './lib/roughen.mjs';
import { validate } from './lib/validate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const LUCIDE = join(ROOT, 'node_modules/lucide-static');
const DATA = join(ROOT, 'packages/data/icons');

const arg = (flag) => {
  const at = process.argv.indexOf(flag);
  return at > -1 ? process.argv[at + 1] : null;
};
const has = (flag) => process.argv.includes(flag);

const ONLY = arg('--only');
const JSON_OUT = arg('--json');
const DRY = has('--dry-run');

const nodes = JSON.parse(readFileSync(join(LUCIDE, 'icon-nodes.json'), 'utf8'));
const lucideVersion = JSON.parse(readFileSync(join(LUCIDE, 'package.json'), 'utf8')).version;

// ── the icons that needed a second look ─────────────────────────────────

/**
 * The escape hatch, and the only place a human judgement about a drawing is
 * written down.
 *
 * A drawing is decided by the icon's name and by two measured rules, which is
 * what makes a rebuild reproduce it exactly. The cost of that is that there is
 * no way to redraw one icon: running the generator again gives back the same
 * glyph. So an icon a person looked at and rejected is listed here, with the
 * reason, and nothing else in the catalogue moves.
 *
 *   "smile-plus": { "seed": 2, "why": "the eyes landed on top of each other" }
 *   "crown":      { "drift": 0.6, "bow": 1.1, "why": "too calm for a crown" }
 *
 * seed draws the same shape from a different sequence, for when the amplitude is
 * right and the throw was not. drift and bow change the amplitude itself.
 */
const OVERRIDES = join(ROOT, 'packages/data/overrides.json');
const settings = existsSync(OVERRIDES) ? JSON.parse(readFileSync(OVERRIDES, 'utf8')) : {};
const overrides = settings.icons ?? {};
// The amplitude the whole catalogue starts from. It lives here rather than in
// the code because it is a drawing decision, and because the tuning sheet has to
// be able to write it.
const amplitude = { ...HAND, ...(settings.hand ?? {}) };

const KNOBS = new Set(['seed', 'drift', 'bow', 'why']);
const BOUNDS = { seed: [1, 999], drift: [0, 1.2], bow: [0, 3] };

const overrideProblems = [];
for (const key of Object.keys(settings)) {
  if (key !== 'hand' && key !== 'icons') {
    overrideProblems.push(`"${key}" is not a section, use hand or icons`);
  }
}
for (const [knob, value] of Object.entries(settings.hand ?? {})) {
  const bounds = BOUNDS[knob];
  if (knob === 'seed' || !bounds) overrideProblems.push(`hand: "${knob}" is not an amplitude`);
  else if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < bounds[0] ||
    value > bounds[1]
  ) {
    overrideProblems.push(`hand: ${knob} ${value} is outside ${bounds[0]} to ${bounds[1]}`);
  }
}
for (const [name, knobs] of Object.entries(overrides)) {
  if (!nodes[name]) {
    overrideProblems.push(`${name}: lucide ${lucideVersion} has no such icon`);
    continue;
  }
  for (const [knob, value] of Object.entries(knobs)) {
    if (!KNOBS.has(knob)) {
      overrideProblems.push(`${name}: "${knob}" is not a knob, use ${[...KNOBS].join(', ')}`);
      continue;
    }
    if (knob === 'why') {
      if (typeof value !== 'string' || !value.trim()) {
        overrideProblems.push(`${name}: why has to say why`);
      }
      continue;
    }
    const [low, high] = BOUNDS[knob];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < low || value > high) {
      overrideProblems.push(`${name}: ${knob} ${value} is outside ${low} to ${high}`);
    }
  }
  if (!knobs.why) overrideProblems.push(`${name}: no why, so nobody can tell if it still applies`);
  if (!('seed' in knobs) && !('drift' in knobs) && !('bow' in knobs)) {
    overrideProblems.push(`${name}: a why and no knob changes nothing`);
  }
}
if (overrideProblems.length) {
  console.error(`packages/data/overrides.json:\n  ${overrideProblems.join('\n  ')}`);
  process.exit(1);
}

/**
 * kebab-case to the name every framework package exports. `circle-question-mark`
 * becomes `CircleQuestionMark`, `trash-2` becomes `Trash2`.
 */
const pascal = (name) =>
  name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const names = ONLY ? JSON.parse(readFileSync(join(ROOT, ONLY), 'utf8')) : Object.keys(nodes).sort();

// ── the names Lucide renamed ────────────────────────────────────────────

/**
 * Lucide keeps an SVG file for every name it has ever used, so its 1756 icons
 * ship as 2007 files. The extra 251 are the old names: Home now lives in
 * house.svg, HelpCircle in circle-question-mark.svg.
 *
 * Exporting them matters, because migrating from Lucide is meant to be an import
 * change and nothing else, and a table maintained by hand would go stale on the
 * next release. So the map is derived: two files drawing the same elements are
 * the same icon.
 */
function aliasesOf() {
  const body = (name) =>
    (
      readFileSync(join(LUCIDE, `icons/${name}.svg`), 'utf8').match(
        /<(?:path|circle|rect|line|polyline|polygon|ellipse)\b[^>]*>/g,
      ) ?? []
    ).join('');

  const canonical = new Map();
  for (const name of Object.keys(nodes)) canonical.set(body(name), name);

  const map = {};
  const orphans = [];
  const files = readdirSync(join(LUCIDE, 'icons'))
    .filter((file) => file.endsWith('.svg'))
    .map((file) => file.slice(0, -4))
    .sort();

  for (const name of files) {
    if (nodes[name]) continue;
    const target = canonical.get(body(name));
    if (target) map[name] = target;
    else orphans.push(name);
  }
  return { map, orphans };
}

// ── drawing ─────────────────────────────────────────────────────────────

const entries = [];
const missing = [];
const failed = [];

for (const name of names) {
  const elements = nodes[name];
  if (!elements || !elements.length) {
    missing.push(elements ? `${name} (no elements)` : name);
    continue;
  }

  const source = elements.map(elementToPath);
  const override = overrides[name];
  const measured = handFor(source);
  const hand = {
    ...measured,
    drift: override?.drift ?? amplitude.drift,
    bow: override?.bow ?? amplitude.bow,
  };
  const frame = frameFor(source);
  // One sequence per icon, seeded on the name and consumed in a fixed order, so
  // the same name always produces the same drawing. A seed override changes the
  // seed text and nothing else, so it redraws this icon and no other.
  const random = makeRandom(override?.seed ? `${name}#${override.seed}` : name);

  try {
    const paths = source.map((path) => {
      const d = roughen(path.d, random, hand, frame);
      validate(name, path.d, d, frame, allowanceFor(hand));
      return path.fill ? { d, fill: path.fill } : { d };
    });
    entries.push({
      name,
      component: pascal(name),
      hand: hand.straight ? 'ruler' : 'hand',
      lucide: lucideVersion,
      ...(override ? { override } : {}),
      paths,
      source,
    });
  } catch (error) {
    failed.push(`${name}: ${error.message}`);
  }
}

if (missing.length) {
  console.error(`not in lucide-static ${lucideVersion}:\n  ${missing.join('\n  ')}`);
}
if (failed.length) {
  console.error(`refused by the validator:\n  ${failed.join('\n  ')}`);
}
if (missing.length || failed.length) process.exit(1);

// Only a full run sees the whole catalogue, so only a full run can tell an old
// name from one that is not in the subset at all.
const drawn = new Set(entries.map((entry) => entry.name));
const { map, orphans } = ONLY ? { map: {}, orphans: [] } : aliasesOf();
const aliases = Object.fromEntries(
  Object.entries(map)
    .filter(([, target]) => drawn.has(target))
    .map(([from, target]) => [from, { component: pascal(from), target }]),
);

if (orphans.length) {
  console.error(`an SVG with no icon behind it:\n  ${orphans.join('\n  ')}`);
  process.exit(1);
}

// Two names that differ only where a hyphen falls produce the same export, and
// the later one would silently win. When both are the same icon the old name is
// redundant, which is the case for the four arrow-down-01 spellings
// against arrow-down-0-1. When they are different icons, something upstream
// changed in a way this generator cannot resolve, so it stops.
const taken = new Map(entries.map((entry) => [entry.component, entry.name]));
const clashes = [];
for (const [from, alias] of Object.entries(aliases)) {
  const other = taken.get(alias.component);
  if (other === alias.target) {
    delete aliases[from];
    continue;
  }
  if (other) clashes.push(`${alias.component}: ${from} and ${other}`);
  else taken.set(alias.component, from);
}
if (clashes.length) {
  console.error(`two icons produce the same export:\n  ${clashes.join('\n  ')}`);
  process.exit(1);
}

// ── writing ─────────────────────────────────────────────────────────────

/**
 * A stable key order and two decimals everywhere, so a rerun over the same
 * Lucide release produces byte identical files and an upstream bump shows only
 * the strokes that actually moved.
 */
const serialise = (entry) => `${JSON.stringify(entry, null, 2)}\n`;

if (!DRY) {
  if (!ONLY) {
    // The catalogue shrinks as well as grows, so a stale file left behind would
    // ship an icon Lucide has dropped.
    rmSync(DATA, { recursive: true, force: true });
  }
  mkdirSync(DATA, { recursive: true });
  for (const entry of entries) writeFileSync(join(DATA, `${entry.name}.json`), serialise(entry));
  if (!ONLY) {
    writeFileSync(join(DATA, '..', 'aliases.json'), `${JSON.stringify(aliases, null, 2)}\n`);
  }
  console.log(
    `wrote ${entries.length} icons, ${readdirSync(DATA).length} files in packages/data/icons`,
  );
}

if (JSON_OUT) {
  mkdirSync(dirname(JSON_OUT), { recursive: true });
  writeFileSync(JSON_OUT, `${JSON.stringify(entries, null, 2)}\n`);
  console.log(`dumped ${entries.length} icons to ${JSON_OUT}`);
}

const ruler = entries.filter((entry) => entry.hand === 'ruler').length;
console.log(
  `lucide ${lucideVersion}, ${entries.length} icons, ` +
    `${ruler} with a ruler, ` +
    `${entries.length - ruler} by hand at drift ${amplitude.drift} and bow ${amplitude.bow}, ` +
    `${Object.keys(aliases).length} names lucide has since renamed`,
);
const touched = entries.filter((entry) => entry.override).length;
if (touched) console.log(`${touched} icons carry an override from packages/data/overrides.json`);
