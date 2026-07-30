import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import type { IconNode } from './types.js';

/**
 * One component for the whole catalogue, taking the icon as an input.
 *
 * The other targets generate a component per icon because their frameworks make
 * that free. Angular does not: every component carries a compiled template and a
 * decorator, so 1756 of them would be 1756 things for the compiler to chew
 * through in every consumer's build. The icons stay data and this draws them.
 *
 * ```html
 * <sketchy-icon [img]="House" [size]="20" color="#2B2521" />
 * ```
 */
@Component({
  selector: 'sketchy-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.stroke]="color()"
      [attr.stroke-width]="width()"
    >
      @for (node of img(); track $index) {
        <svg:path [attr.d]="node[1]['d']" [attr.fill]="node[1]['fill'] ?? 'none'" />
      }
    </svg>
  `,
  styles: ':host { display: inline-flex }',
})
export class SketchyIconComponent {
  /** The icon to draw, from @sketchyicons/angular or @sketchyicons/data. */
  readonly img = input.required<IconNode>();

  /** Width and height in one input. Defaults to 24. */
  readonly size = input<string | number>(24);

  /** The stroke. Defaults to currentColor. */
  readonly color = input<string>('currentColor');

  /** Stroke width in viewBox units. Defaults to 2. */
  readonly strokeWidth = input<string | number>(2);

  /**
   * Keeps the stroke the same visual width whatever the size, by scaling
   * strokeWidth by 24 over size. Off by default, as in Lucide.
   */
  readonly absoluteStrokeWidth = input(false);

  protected readonly width = computed(() =>
    this.absoluteStrokeWidth()
      ? (Number(this.strokeWidth()) * 24) / Number(this.size())
      : this.strokeWidth(),
  );
}
