import { h } from 'vue';

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
 * A functional component rather than a defined one: an icon holds no state and
 * has no lifecycle, so it costs a render call and nothing else.
 */
const createSketchyIcon = (name: string, nodes: IconNode): SketchyIcon => {
  const Icon: SketchyIcon = (props: SketchyIconProps, { slots }) => {
    const {
      color = 'currentColor',
      size = 24,
      strokeWidth = 2,
      absoluteStrokeWidth = false,
      ...rest
    } = props;

    return h(
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
      [
        ...nodes.map(([tag, attributes]) => h(tag, attributes)),
        ...(slots.default ? [slots.default()] : []),
      ],
    );
  };

  Icon.displayName = name;
  return Icon;
};

export default createSketchyIcon;
