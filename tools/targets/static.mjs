// @sketchyicons/static: one SVG file per icon, plus a sprite.
//
// This is what makes the set usable outside JavaScript, from Flutter, SwiftUI,
// Figma or plain HTML. No build step and no JavaScript at all.

import { attributesOf } from '../lib/icons.mjs';

const SVG_ATTRIBUTES = [
  'xmlns="http://www.w3.org/2000/svg"',
  'width="24"',
  'height="24"',
  'viewBox="0 0 24 24"',
  'fill="none"',
  'stroke="currentColor"',
  'stroke-width="2"',
  'stroke-linecap="round"',
  'stroke-linejoin="round"',
];

const SYMBOL_ATTRIBUTES = [
  'viewBox="0 0 24 24"',
  'fill="none"',
  'stroke="currentColor"',
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

export default {
  name: 'static',
  package: 'packages/static',
  clean: ['icons'],

  /** @param {import('../lib/icons.mjs').Icon[]} icons */
  files(icons) {
    const perIcon = icons.map((icon) => ({
      path: `icons/${icon.name}.svg`,
      content:
        `<!-- sketchyicons, geometry derived from Lucide ${icon.lucide}, ISC, (c) Lucide Icons and Contributors -->\n` +
        `<svg ${SVG_ATTRIBUTES.join(' ')} class="sketchy sketchy-${icon.name}">\n` +
        `${pathTags(icon, '  ')}\n` +
        '</svg>\n',
    }));

    const sprite =
      `<!-- sketchyicons, geometry derived from Lucide ${icons[0].lucide}, ISC, (c) Lucide Icons and Contributors -->\n` +
      '<svg xmlns="http://www.w3.org/2000/svg" style="display:none">\n' +
      icons
        .map(
          (icon) =>
            `  <symbol id="${icon.name}" ${SYMBOL_ATTRIBUTES.join(' ')}>\n` +
            `${pathTags(icon, '    ')}\n` +
            '  </symbol>',
        )
        .join('\n') +
      '\n</svg>\n';

    // The same shape as Lucide's icon-nodes.json, so a tool written against
    // theirs reads ours without a change.
    const nodes = Object.fromEntries(
      icons.map((icon) => [icon.name, icon.paths.map((path) => ['path', attributesOf(path)])]),
    );

    return [
      ...perIcon,
      { path: 'sprite.svg', content: sprite },
      { path: 'icons.json', content: `${JSON.stringify(nodes, null, 2)}\n` },
    ];
  },
};
