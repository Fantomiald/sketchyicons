import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type Svg from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

/** The attributes of one drawn element. Every sketchyicons node is a path. */
export type IconNodeAttributes = Record<string, string | number>;

/**
 * An icon as a list of elements, the same shape Lucide uses, so their
 * createLucideIcon accepts one of ours unchanged.
 */
export type IconNode = [tag: string, attributes: IconNodeAttributes][];

/**
 * The props match Lucide's, so migrating is an import change and nothing else.
 * Anything else is forwarded to react-native-svg's Svg.
 */
export interface SketchyIconProps extends Omit<SvgProps, 'ref'> {
  /** Width and height in one prop. Defaults to 24. */
  size?: string | number;
  /**
   * Keeps the stroke the same visual width whatever the size, by scaling
   * strokeWidth by 24 over size. Off by default, as in Lucide.
   */
  absoluteStrokeWidth?: boolean;
}

export type SketchyIcon = ForwardRefExoticComponent<SketchyIconProps & RefAttributes<Svg>>;
