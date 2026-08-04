// packages/figma-plugin: icon geometry as SVG strings, embedded at build
// time so the plugin makes no network request. Stroke is a solid color
// instead of currentColor, which figma.createNodeFromSvg does not resolve.

import { attributesOf, readAliases } from '../lib/icons.mjs';

const STROKE = '#17130e'; // Ink, from web/src/lib/color.ts

const SVG_ATTRIBUTES = [
  'xmlns="http://www.w3.org/2000/svg"',
  'width="24"',
  'height="24"',
  'viewBox="0 0 24 24"',
  'fill="none"',
  `stroke="${STROKE}"`,
  'stroke-width="2"',
  'stroke-linecap="round"',
  'stroke-linejoin="round"',
];

const pathTags = (icon, indent) =>
  icon.paths
    .map((path) => {
      const attributes = Object.entries(attributesOf(path))
        .map(([key, value]) => `${key}="${value}"`)
        .join(' ');
      return `${indent}<path ${attributes} />`;
    })
    .join('\n');

const svgOf = (icon) => `<svg ${SVG_ATTRIBUTES.join(' ')}>\n${pathTags(icon, '  ')}\n</svg>\n`;

export default {
  name: 'figma-plugin',
  package: 'packages/figma-plugin',
  clean: ['src/generated'],

  /** @param {import('../lib/icons.mjs').Icon[]} icons */
  files(icons) {
    const bundle = {
      icons: Object.fromEntries(icons.map((icon) => [icon.name, svgOf(icon)])),
      aliases: Object.fromEntries(readAliases(icons).map((alias) => [alias.name, alias.target])),
    };
    return [{ path: 'src/generated/icons.json', content: `${JSON.stringify(bundle)}\n` }];
  },
};
