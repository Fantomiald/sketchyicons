// Reading the committed geometry. Every target is generated from here and never
// from Lucide directly.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
export const DATA = join(ROOT, 'packages/data/icons');
const ALIASES = join(ROOT, 'packages/data/aliases.json');

/**
 * @typedef {{ d: string, fill?: string }} DrawnPath
 * @typedef {{ name: string, component: string, target: string, targetComponent: string }} Alias
 * @typedef {{ name: string, component: string, hand: 'hand' | 'ruler', lucide: string,
 *   paths: DrawnPath[], source: DrawnPath[] }} Icon
 */

/**
 * Every icon, in name order, so a generated barrel does not reshuffle between
 * runs on a different filesystem.
 *
 * @returns {Icon[]}
 */
export function readIcons() {
  const files = readdirSync(DATA)
    .filter((file) => file.endsWith('.json'))
    .sort();
  if (!files.length) {
    throw new Error('packages/data/icons is empty, run node tools/roughen-icons.mjs first');
  }
  return files.map((file) => JSON.parse(readFileSync(join(DATA, file), 'utf8')));
}

/**
 * The names Lucide has renamed, so someone migrating changes an import line and
 * nothing else. Derived by the generator from Lucide's own files, never listed
 * by hand.
 *
 * @param {Icon[]} icons
 * @returns {Alias[]}
 */
export function readAliases(icons) {
  if (!existsSync(ALIASES)) return [];
  const raw = JSON.parse(readFileSync(ALIASES, 'utf8'));
  const components = new Map(icons.map((icon) => [icon.name, icon.component]));
  return Object.entries(raw)
    .filter(([, alias]) => components.has(alias.target))
    .map(([name, alias]) => ({
      name,
      component: alias.component,
      target: alias.target,
      targetComponent: components.get(alias.target),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** The attributes of a drawn path, as a target has to write them out. */
export function attributesOf(path) {
  return path.fill ? { d: path.d, fill: path.fill } : { d: path.d };
}

/**
 * A path as an icon node, the shape Lucide uses too, so its createLucideIcon
 * accepts one of ours unchanged.
 */
export const nodeLiteral = (path) =>
  path.fill ? `['path', { d: '${path.d}', fill: '${path.fill}' }]` : `['path', { d: '${path.d}' }]`;

export const nodesLiteral = (icon) =>
  `[\n${icon.paths.map((path) => `  ${nodeLiteral(path)},`).join('\n')}\n]`;

/** The banner every generated file carries. */
export const banner = (icon) =>
  `// Generated from packages/data/icons/${icon.name}.json by tools/build-targets.mjs.\n` +
  `// Geometry derived from Lucide ${icon.lucide}, ISC, (c) Lucide Icons and Contributors.\n`;
