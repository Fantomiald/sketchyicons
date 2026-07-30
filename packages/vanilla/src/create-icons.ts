import createElement from './create-element.js';
import type { Attributes, IconNode } from './types.js';

export interface CreateIconsOptions {
  /** The icons to look for, keyed by the name used in the markup. */
  icons: Record<string, IconNode>;
  /** Extra attributes for every svg this draws. */
  attrs?: Attributes;
  /** The attribute carrying the icon name. Defaults to data-sketchy. */
  nameAttr?: string;
  /** Where to look. Defaults to the whole document. */
  root?: ParentNode;
}

/** kebab-case to the name the packages export: house becomes House. */
const pascal = (name: string) =>
  name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

/**
 * Replaces every element carrying the name attribute with the icon it names.
 *
 * ```html
 * <i data-sketchy="house"></i>
 * <script type="module">
 *   import { createIcons, House } from 'sketchyicons';
 *   createIcons({ icons: { House } });
 * </script>
 * ```
 *
 * Only the icons handed over are drawn, so a page pays for what it uses. Passing
 * every icon means shipping every icon.
 */
export default function createIcons({
  icons,
  attrs = {},
  nameAttr = 'data-sketchy',
  root = document,
}: CreateIconsOptions): void {
  if (!icons || !Object.keys(icons).length) {
    throw new Error('createIcons needs the icons it should draw, none were given');
  }

  for (const element of root.querySelectorAll(`[${nameAttr}]`)) {
    const name = element.getAttribute(nameAttr);
    if (!name) continue;
    const icon = icons[pascal(name)] ?? icons[name];
    if (!icon) continue;

    // The element's own attributes win over the shared ones, so a single icon
    // can be sized or coloured in the markup.
    const own: Attributes = {};
    for (const attribute of Array.from(element.attributes)) {
      if (attribute.name !== nameAttr) own[attribute.name] = attribute.value;
    }
    element.replaceWith(createElement(icon, { ...attrs, ...own }));
  }
}
