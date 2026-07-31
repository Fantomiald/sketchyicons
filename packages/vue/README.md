# @sketchyicons/vue

Hand drawn icons for Vue 3. The geometry is derived from
[Lucide](https://lucide.dev), and a generator adds the hand.

```sh
npm install @sketchyicons/vue
```

`vue` 3 is the only peer dependency. There are no runtime dependencies.

## Use

```vue
<script setup lang="ts">
import { House, Star } from '@sketchyicons/vue';
</script>

<template>
  <House :size="20" />
  <Star :size="15" color="#2B2521" :stroke-width="1.75" fill="currentColor" />
</template>
```

One icon per file, so importing one does not pull in the rest. A single icon
costs 466 bytes minified and brotlied.

```ts
import { House } from '@sketchyicons/vue';
import House from '@sketchyicons/vue/icons/house';
```

Icons are functional components: they hold no state and have no lifecycle, so
they cost a render call and nothing else.

## Coming from Lucide

Swap the package name. The props are the same, and the 247 names Lucide has
renamed are exported alongside the new ones.

```diff
-import { Home, HelpCircle } from 'lucide-vue-next';
+import { Home, HelpCircle } from '@sketchyicons/vue';
```

## Props

| Prop                  | Type               | Default        | What it does                                             |
| --------------------- | ------------------ | -------------- | -------------------------------------------------------- |
| `size`                | `number \| string` | `24`           | width and height in one prop                             |
| `color`               | `string`           | `currentColor` | the stroke                                               |
| `strokeWidth`         | `number \| string` | `2`            | stroke width, in viewBox units                           |
| `absoluteStrokeWidth` | `boolean`          | `false`        | keeps the stroke the same visual width whatever the size |
| `fill`                | `string`           | `none`         | fills the shape                                          |

Anything else is forwarded to the `svg` element, `class`, `style`, `@click`,
`aria-label` and the rest.

## Your own icon

```ts
import { createSketchyIcon } from '@sketchyicons/vue';

const Squiggle = createSketchyIcon('Squiggle', [['path', { d: 'M2 12Q8 4 12 12T22 12' }]]);
```

## Licence

MIT for the code, see `LICENSE`. The geometry is derived from Lucide and keeps
Lucide's ISC terms, see `NOTICE`. Not affiliated with Lucide.
