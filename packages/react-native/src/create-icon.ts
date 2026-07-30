import { createElement, forwardRef } from 'react';
import Svg, { Path } from 'react-native-svg';

import type { IconNode, SketchyIcon, SketchyIconProps } from './types.js';

/**
 * What every icon carries unless a prop overrides it. The stroke is round
 * capped and round joined because the geometry is drawn, not plotted.
 */
const defaults = {
  viewBox: '0 0 24 24',
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/**
 * react-native-svg takes components, not tag names, so the tag in a node has to
 * be looked up. Every sketchyicons node is a path, and an unknown tag throws
 * rather than rendering nothing: react-native-svg drops what it does not
 * understand without a word, and a missing icon with no error is the most
 * tedious bug in this project.
 */
const elements: Record<string, typeof Path> = { path: Path };

/**
 * Turns geometry into a component. This is the one file that decides what props
 * an icon takes, which is why there are 1756 generated files and not 1756
 * hand written ones.
 */
const createSketchyIcon = (name: string, nodes: IconNode): SketchyIcon => {
  const Icon = forwardRef<Svg, SketchyIconProps>(
    (
      {
        color = 'currentColor',
        size = 24,
        strokeWidth = 2,
        absoluteStrokeWidth = false,
        children,
        ...rest
      },
      ref,
    ) =>
      createElement(
        Svg,
        {
          ref,
          ...defaults,
          width: size,
          height: size,
          stroke: color,
          strokeWidth: absoluteStrokeWidth
            ? (Number(strokeWidth) * 24) / Number(size)
            : strokeWidth,
          ...rest,
        },
        ...nodes.map(([tag, attributes], index) => {
          const element = elements[tag];
          if (!element) throw new Error(`${name}: react-native-svg has no element for "${tag}"`);
          return createElement(element, { key: `${tag}-${index}`, ...attributes });
        }),
        ...(Array.isArray(children) ? children : [children]),
      ),
  );

  Icon.displayName = name;
  return Icon;
};

export default createSketchyIcon;
