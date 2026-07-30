import type { Attributes, IconNode } from './types.js';

const NS = 'http://www.w3.org/2000/svg';

/**
 * What every icon carries unless an attribute overrides it. The stroke is round
 * capped and round joined because the geometry is drawn, not plotted.
 */
const defaults: Attributes = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 2,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
};

/**
 * Builds an svg element from an icon.
 *
 * Attributes are written in SVG's own spelling, stroke-width rather than
 * strokeWidth, because this returns a DOM node and not a framework's idea of
 * one.
 */
export default function createElement(icon: IconNode, attributes: Attributes = {}): SVGElement {
  const svg = document.createElementNS(NS, 'svg');
  for (const [key, value] of Object.entries({ ...defaults, ...attributes })) {
    svg.setAttribute(key, String(value));
  }
  for (const [tag, nodeAttributes] of icon) {
    const child = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(nodeAttributes)) {
      child.setAttribute(key, String(value));
    }
    svg.append(child);
  }
  return svg;
}
