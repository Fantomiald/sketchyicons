# @sketchyicons/solid

Hand drawn icons for Solid. The geometry is derived from
[Lucide](https://lucide.dev), and a generator adds the hand.

```sh
npm install @sketchyicons/solid
```

`solid-js` 1.8 or later is the only peer dependency. There are no runtime dependencies.

## Use

```tsx
import { House, Star } from '@sketchyicons/solid';

<House size={20} />
<Star size={15} color="#2B2521" strokeWidth={1.75} fill="currentColor" />
```

One icon per file, so importing one does not pull in the rest.

```ts
import { House } from '@sketchyicons/solid';
import House from '@sketchyicons/solid/icons/house';
```

## Coming from Lucide

Swap the package name. The props are the same, and the 247 names Lucide has
renamed are exported alongside the new ones.

```diff
-import { Home, HelpCircle } from 'lucide-solid';
+import { Home, HelpCircle } from '@sketchyicons/solid';
```

## Props

| Prop                  | Type               | Default        | What it does                                             |
| --------------------- | ------------------ | -------------- | -------------------------------------------------------- |
| `size`                | `number \| string` | `24`           | width and height in one prop                             |
| `color`               | `string`           | `currentColor` | the stroke                                               |
| `strokeWidth`         | `number \| string` | `2`            | stroke width, in viewBox units                           |
| `absoluteStrokeWidth` | `boolean`          | `false`        | keeps the stroke the same visual width whatever the size |
| `fill`                | `string`           | `none`         | fills the shape                                          |

Anything else is forwarded to the `svg` element. Props are read reactively, so
a signal passed as `size` or `color` updates the icon without remounting it.

The components are built with `solid-js/h` rather than JSX, so the package needs
no compile step of its own and its only peer dependency is `solid-js`.

## Your own icon

```ts
import { createSketchyIcon } from '@sketchyicons/solid';

const Squiggle = createSketchyIcon('Squiggle', [['path', { d: 'M2 12Q8 4 12 12T22 12' }]]);
```

## Licence

MIT for the code, see `LICENSE`. The geometry is derived from Lucide and keeps
Lucide's ISC terms, see `NOTICE`. Not affiliated with Lucide.
