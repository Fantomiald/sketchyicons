/** The attributes of one drawn element. Every sketchyicons node is a path. */
export type IconNodeAttributes = Record<string, string | number>;

/**
 * An icon as a list of elements, the same shape Lucide uses, so their
 * createLucideIcon accepts one of ours unchanged.
 */
export type IconNode = [tag: string, attributes: IconNodeAttributes][];
