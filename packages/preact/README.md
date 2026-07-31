# @sketchyicons/preact

Hand drawn icons for Preact. The geometry is derived from
[Lucide](https://lucide.dev), and a generator adds the hand.

```sh
npm install @sketchyicons/preact
```

`preact` 10 is the only peer dependency. There are no runtime dependencies.

## Use

```tsx
import { House, Star } from '@sketchyicons/preact';

<House size={20} />
<Star size={15} color="#2B2521" strokeWidth={1.75} fill="currentColor" />
```

One icon per file, so importing one does not pull in the rest. A single icon
costs 467 bytes minified and brotlied.

```ts
import { House } from '@sketchyicons/preact';
import House from '@sketchyicons/preact/icons/house';
```

## Coming from Lucide

Swap the package name. The props are the same, and the 247 names Lucide has
renamed are exported alongside the new ones.

```diff
-import { Home, HelpCircle } from 'lucide-preact';
+import { Home, HelpCircle } from '@sketchyicons/preact';
```

## Props

| Prop                  | Type               | Default        | What it does                                             |
| --------------------- | ------------------ | -------------- | -------------------------------------------------------- |
| `size`                | `number \| string` | `24`           | width and height in one prop                             |
| `color`               | `string`           | `currentColor` | the stroke                                               |
| `strokeWidth`         | `number \| string` | `2`            | stroke width, in viewBox units                           |
| `absoluteStrokeWidth` | `boolean`          | `false`        | keeps the stroke the same visual width whatever the size |
| `fill`                | `string`           | `none`         | fills the shape                                          |

Anything else is forwarded to the `svg` element.

Attributes land on the element in SVG's own spelling. React rewrites the camel
case form, Preact does not, so the factory writes `stroke-width` rather than
`strokeWidth`. The prop stays `strokeWidth` so the API still matches Lucide's.

## Your own icon

```ts
import { createSketchyIcon } from '@sketchyicons/preact';

const Squiggle = createSketchyIcon('Squiggle', [['path', { d: 'M2 12Q8 4 12 12T22 12' }]]);
```

## Licence

MIT for the code, see `LICENSE`. The geometry is derived from Lucide and keeps
Lucide's ISC terms, see `NOTICE`. Not affiliated with Lucide.
