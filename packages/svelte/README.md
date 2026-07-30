# @sketchyicons/svelte

Hand drawn icons for Svelte 5. The geometry is derived from
[Lucide](https://lucide.dev), and a generator adds the hand.

```sh
npm install @sketchyicons/svelte
```

`svelte` 5 is the only peer dependency. There are no runtime dependencies.

## Use

One component draws them all, and the icon is a prop:

```svelte
<script lang="ts">
  import { SketchyIcon, House, Star } from '@sketchyicons/svelte';
</script>

<SketchyIcon img={House} size={20} />
<SketchyIcon img={Star} size={15} color="#2B2521" strokeWidth={1.75} />
```

The React style targets in this project generate a component per icon, because
their frameworks make that free. A Svelte component is a file your bundler
compiles, so 1756 of them would be 1756 compilations in every build that uses
one. The icons stay data and one component draws them, which is the shape the
Angular target takes too.

Icons are plain constants with no side effects, so a bundler drops the ones you
did not import.

```ts
import { House } from '@sketchyicons/svelte';
import House from '@sketchyicons/svelte/icons/house';
```

## Props

| Prop                  | Type               | Default        | What it does                                             |
| --------------------- | ------------------ | -------------- | -------------------------------------------------------- |
| `img`                 | `IconNode`         | required       | the icon to draw                                         |
| `size`                | `number \| string` | `24`           | width and height in one prop                             |
| `color`               | `string`           | `currentColor` | the stroke                                               |
| `strokeWidth`         | `number \| string` | `2`            | stroke width, in viewBox units                           |
| `absoluteStrokeWidth` | `boolean`          | `false`        | keeps the stroke the same visual width whatever the size |

Anything else lands on the `svg` element, `class`, `style`, `onclick`,
`aria-label` and the rest.

## Coming from Lucide

The 247 names Lucide has renamed are exported alongside the new ones, so `Home`,
`HelpCircle` and `MoreHorizontal` still resolve.

```diff
-import { Home } from '@lucide/svelte';
+import { SketchyIcon, Home } from '@sketchyicons/svelte';
```

The shape differs: Lucide ships a component per icon, this ships one component
and the icons as data. The icon data is the same shape, so `img` takes either.

## The component ships uncompiled

`Icon.svelte` travels as source, the way a Svelte package does, and your bundler
compiles it. That means importing the package from plain Node without a Svelte
plugin will fail on that file. The icon data at `@sketchyicons/svelte/icons/*`
is ordinary JavaScript and imports anywhere.

## Licence

MIT for the code, see `LICENSE`. The geometry is derived from Lucide and keeps
Lucide's ISC terms, see `NOTICE`. Not affiliated with Lucide.
