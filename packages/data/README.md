# @sketchyicons/data

The geometry behind [sketchyicons](https://github.com/Fantomiald/sketchyicons),
with no framework and no dependency. Every framework package is generated from
this one.

```sh
npm install @sketchyicons/data
```

## Use

Reach for this when you are rendering the icons yourself: a framework nobody has
written a target for yet, a canvas, a PDF, a plotter.

```ts
import { House, iconNames } from '@sketchyicons/data';
import type { IconNode, IconName } from '@sketchyicons/data';

// [['path', { d: 'M14.72 21.05Q16.02 17 ...' }], ...]
const svg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  ${House.map(([, attributes]) => `<path d="${attributes.d}" />`).join('')}
</svg>`;
```

Icons are named constants rather than one module each, so a bundler drops the
ones nobody imported. One icon costs 250 bytes minified and brotlied.

## What it exports

| Export                            | Type                       | What it holds                                          |
| --------------------------------- | -------------------------- | ------------------------------------------------------ |
| `House`, `Star`, and one per icon | `IconNode`                 | the drawn geometry                                     |
| `iconNames`                       | `readonly IconName[]`      | every name in kebab case, in name order                |
| `componentNames`                  | `readonly ComponentName[]` | the same names as the framework packages export them   |
| `renamed`                         | `readonly [old, now][]`    | the 247 names Lucide has renamed, and what they became |
| `IconNode`                        | type                       | `[tag, attributes][]`                                  |
| `IconNodeAttributes`              | type                       | `Record<string, string \| number>`                     |

`IconNode` is the shape Lucide uses, so their `createLucideIcon` accepts one of
ours unchanged.

Every path draws with `fill="none"`, `stroke-linecap="round"` and
`stroke-linejoin="round"` on a `0 0 24 24` viewBox. A path that carries its own
`fill` is meant to be filled, and there are a handful: small dots that read as
a ring without it.

## Where it comes from

The geometry is derived from [Lucide](https://lucide.dev) once per upstream
release, not on every build. Straight runs bow, coordinates drift, and the drift
is seeded from the icon name, so the same name always draws the same glyph.

## Licence

MIT for the code, see `LICENSE`. The geometry is derived from Lucide and keeps
Lucide's ISC terms, see `NOTICE`. Not affiliated with Lucide.
