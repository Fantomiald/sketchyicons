import h from 'solid-js/h';
import { mergeProps, splitProps } from 'solid-js';

import type { JSX } from 'solid-js';

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
 * solid-js/h rather than JSX, so the package needs no compile step of its own
 * and its only peer dependency is solid-js. Props are read through mergeProps
 * and splitProps rather than destructured, because destructuring a Solid props
 * object reads it once and drops its reactivity.
 *
 * h returns a thunk that Solid's runtime resolves when it inserts the node,
 * which JSX.Element does not describe, so the return is asserted. What settles
 * it is rendering: tests/targets.test.mjs draws an icon through a real Solid
 * root and compares the markup against the geometry the generator wrote.
 */
const createSketchyIcon = (name: string, nodes: IconNode): SketchyIcon => {
  const Icon = (raw: SketchyIconProps) => {
    const props = mergeProps(
      { color: 'currentColor', size: 24, strokeWidth: 2, absoluteStrokeWidth: false },
      raw,
    );
    const [, rest] = splitProps(props, [
      'color',
      'size',
      'strokeWidth',
      'absoluteStrokeWidth',
      'children',
    ]);

    return h(
      'svg',
      {
        ...defaults,
        get width() {
          return props.size;
        },
        get height() {
          return props.size;
        },
        get stroke() {
          return props.color;
        },
        get 'stroke-width'() {
          return props.absoluteStrokeWidth
            ? (Number(props.strokeWidth) * 24) / Number(props.size)
            : props.strokeWidth;
        },
        ...rest,
      },
      ...nodes.map(([tag, attributes]) => h(tag, attributes)),
    ) as unknown as JSX.Element;
  };

  Object.defineProperty(Icon, 'name', { value: name });
  return Icon satisfies SketchyIcon;
};

export default createSketchyIcon;
