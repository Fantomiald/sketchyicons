import { h } from 'preact';

import type { IconNode, SketchyIcon, SketchyIconProps } from './types.js';

/**
 * What every icon carries unless a prop overrides it. The stroke is round
 * capped and round joined because the geometry is drawn, not plotted.
 */
const defaults = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
} as const;

/**
 * Turns geometry into a component. This is the one file that decides what props
 * an icon takes, which is why there are 1756 generated files and not 1756
 * hand written ones.
 *
 * Attributes go on the element in SVG's own spelling, stroke-width and not
 * strokeWidth. React rewrites the camel case form, Preact does not: it writes
 * strokeWidth straight onto the element, where the browser ignores it. The prop
 * stays strokeWidth so the API still matches Lucide's.
 */
const createSketchyIcon = (name: string, nodes: IconNode): SketchyIcon => {
  const Icon: SketchyIcon = ({
    color = 'currentColor',
    size = 24,
    strokeWidth = 2,
    absoluteStrokeWidth = false,
    children,
    ...rest
  }: SketchyIconProps) =>
    h(
      'svg',
      {
        ...defaults,
        width: size,
        height: size,
        stroke: color,
        'stroke-width': absoluteStrokeWidth
          ? (Number(strokeWidth) * 24) / Number(size)
          : strokeWidth,
        ...rest,
      },
      ...nodes.map(([tag, attributes], index) => h(tag, { key: `${tag}-${index}`, ...attributes })),
      ...(Array.isArray(children) ? children : [children]),
    );

  Icon.displayName = name;
  return Icon;
};

export default createSketchyIcon;
