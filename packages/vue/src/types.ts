import type { FunctionalComponent, SVGAttributes } from 'vue';

/** The attributes of one drawn element. Every sketchyicons node is a path. */
export type IconNodeAttributes = Record<string, string | number>;

/**
 * An icon as a list of elements, the same shape Lucide uses, so their
 * createLucideIcon accepts one of ours unchanged.
 */
export type IconNode = [tag: string, attributes: IconNodeAttributes][];

/**
 * The props match Lucide's, so migrating is an import change and nothing else.
 * Anything else is forwarded to the svg element.
 */
export interface SketchyIconProps extends Partial<SVGAttributes> {
  /** Width and height in one prop. Defaults to 24. */
  size?: string | number;
  /** The stroke. Defaults to currentColor. */
  color?: string;
  /** Stroke width in viewBox units. Defaults to 2. */
  strokeWidth?: string | number;
  /**
   * Keeps the stroke the same visual width whatever the size, by scaling
   * strokeWidth by 24 over size. Off by default, as in Lucide.
   */
  absoluteStrokeWidth?: boolean;
}

export type SketchyIcon = FunctionalComponent<SketchyIconProps>;
