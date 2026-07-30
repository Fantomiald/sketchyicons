<!--
  One component for the whole catalogue, taking the icon as a prop.

  The React style targets generate a component per icon because their frameworks
  make that free. A Svelte component is a file the consumer's bundler compiles,
  so 1756 of them would be 1756 compilations in every build that uses one. The
  icons stay data and this draws them, which is the same shape the Angular target
  takes and for the same reason.
-->
<script lang="ts">
  import type { SketchyIconProps } from './types.js';

  let {
    img,
    size = 24,
    color = 'currentColor',
    strokeWidth = 2,
    absoluteStrokeWidth = false,
    ...rest
  }: SketchyIconProps = $props();

  const width = $derived(
    absoluteStrokeWidth ? (Number(strokeWidth) * 24) / Number(size) : strokeWidth,
  );
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  fill="none"
  stroke-linecap="round"
  stroke-linejoin="round"
  width={size}
  height={size}
  stroke={color}
  stroke-width={width}
  {...rest}
>
  {#each img as [, attributes], index (index)}
    <path d={String(attributes.d)} fill={String(attributes.fill ?? 'none')} />
  {/each}
</svg>
