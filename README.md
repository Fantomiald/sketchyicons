# sketchyicons

Hand drawn icons that nobody drew by hand.

The geometry comes from [Lucide](https://lucide.dev), and a generator adds the
hand: straight runs bow, curves change their fullness, every coordinate drifts a
fraction of a unit, and the drift is seeded from the icon name. Two builds are
byte identical, and an upstream Lucide bump shows only the strokes that moved.

1756 icons. The props match Lucide's, so migrating is an import change and
nothing else.

```sh
npm install @sketchyicons/react
```

```tsx
import { House, Star } from '@sketchyicons/react';

<House size={20} />
<Star size={15} color="#2B2521" strokeWidth={1.75} fill="currentColor" />
```

## Packages

| Package                                               | What it holds                             |
| ----------------------------------------------------- | ----------------------------------------- |
| [`@sketchyicons/react`](packages/react)               | one React component per icon              |
| [`@sketchyicons/react-native`](packages/react-native) | the same over `react-native-svg`          |
| [`@sketchyicons/data`](packages/data)                 | the geometry, no framework, no dependency |
| [`@sketchyicons/static`](packages/static)             | one SVG file per icon, plus a sprite      |

Every framework package is generated from `data`, never from Lucide directly.
A target whose icon file is a factory call is five lines under `tools/targets`:
React, React Native, Vue, Preact and Solid all share one. Angular and Svelte
compile a component in the consumer's build, so they ship one component and the
icons as data, and they carry their own packaging step.

## Coming from Lucide

Swap the package name. The props are the same, and the 247 names Lucide has
renamed are exported alongside the new ones, so `Home`, `HelpCircle` and
`MoreHorizontal` still resolve.

```diff
-import { Home, Star } from 'lucide-react';
+import { Home, Star } from '@sketchyicons/react';
```

## What it costs

Measured with `size-limit`, minified and brotlied, `react` excluded. `pnpm size`
runs it and CI fails if it drifts.

| Import       | Size      |
| ------------ | --------- |
| one icon     | 497 B     |
| twelve icons | 2.22 kB   |
| all 1756     | 282.56 kB |

One icon per file, and every `package.json` in the tarball carries
`"sideEffects": false`, so importing one icon does not pull in the rest. Zero
runtime dependencies.

## Reading at 15 pixels

15 is the size an application uses inside a control, and it is where a wobbly
stroke turns to mud. Every icon is drawn to hold at 15, 20 and 24.

How much hand a shape takes is measured from its own geometry rather than sorted
by hand. A coordinate cannot wander further than the shorter of the two runs
meeting at it, and a subpath with no curve in it is held to a ruler, which is
what keeps the plus inside `circle-plus` a plus.
[docs/heuristic.md](docs/heuristic.md) has the rules and the numbers behind every
constant.

## Working on it

```sh
pnpm install
pnpm build       # generate every target and compile
pnpm test

pnpm generate    # redraw packages/data/icons from lucide-static
pnpm preview     # the contact sheet, lucide beside the drawn version
pnpm tune        # the two knobs on sliders, exports packages/data/overrides.json
```

`pnpm generate` runs when someone deliberately follows a new Lucide release, not
on every build. It takes 0.6 seconds for the whole catalogue, and its diff is the
review. `lucide-static` is a devDependency and never ships in a published
package.

[CONTRIBUTING.md](CONTRIBUTING.md) is the reference for the layout, the commit
format, the writing style, versioning and the release flow.

## Licence

The code is MIT, see [LICENSE](LICENSE).

The geometry is derived from Lucide and keeps Lucide's terms: ISC,
(c) Lucide Icons and Contributors. Part of Lucide is itself derived from Feather,
which is MIT. Both notices are in [NOTICE](NOTICE), in full, as both licences
require.

sketchyicons is not affiliated with Lucide and is not endorsed by it.
