# @sketchyicons/react

Hand drawn icons for React. The geometry is derived from
[Lucide](https://lucide.dev), and a generator adds the hand.

```sh
npm install @sketchyicons/react
```

`react` 18 or 19 is the only peer dependency. There are no runtime dependencies.

## Use

```tsx
import { House, Star } from '@sketchyicons/react';

export const Header = () => (
  <nav>
    <House size={20} />
    <Star size={15} color="#2B2521" strokeWidth={1.75} fill="currentColor" />
  </nav>
);
```

One icon per file, so importing one does not pull in the rest. A single icon
costs 492 bytes minified and brotlied, all 1756 cost 282 kB.

## Coming from Lucide

Swap the package name. The props are the same, and the 247 names Lucide has
renamed are exported alongside the new ones, so `Home`, `HelpCircle` and
`MoreHorizontal` still resolve.

```diff
-import { Home, HelpCircle } from 'lucide-react';
+import { Home, HelpCircle } from '@sketchyicons/react';
```

The barrel is pure re-exports and every package.json in the tarball carries
`"sideEffects": false`, so the two common import styles cost the same:

```tsx
import { House } from '@sketchyicons/react';
import House from '@sketchyicons/react/icons/house';
```

## Props

The props match Lucide's, so migrating is an import change and nothing else.

| Prop                  | Type               | Default        | What it does                                             |
| --------------------- | ------------------ | -------------- | -------------------------------------------------------- |
| `size`                | `number \| string` | `24`           | width and height in one prop                             |
| `color`               | `string`           | `currentColor` | the stroke                                               |
| `strokeWidth`         | `number \| string` | `2`            | stroke width, in viewBox units                           |
| `absoluteStrokeWidth` | `boolean`          | `false`        | keeps the stroke the same visual width whatever the size |
| `fill`                | `string`           | `none`         | fills the shape                                          |

Anything else is forwarded to the `svg` element, `className`, `onClick`,
`aria-label`, `data-` attributes and the rest. The ref lands on the `svg`.

```tsx
const ref = useRef<SVGSVGElement>(null);
<House ref={ref} className="icon" aria-label="Home" onClick={open} />;
```

## Your own icon

`createSketchyIcon` is the factory the generated components use. Its node shape
is Lucide's, so their `createLucideIcon` accepts one of ours and the other way
round.

```tsx
import { createSketchyIcon } from '@sketchyicons/react';

const Squiggle = createSketchyIcon('Squiggle', [['path', { d: 'M2 12Q8 4 12 12T22 12' }]]);
```

## Licence

MIT for the code, see `LICENSE`. The geometry is derived from Lucide and keeps
Lucide's ISC terms, see `NOTICE`. Not affiliated with Lucide.
