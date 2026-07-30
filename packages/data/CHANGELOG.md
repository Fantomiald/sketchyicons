# @sketchyicons/data

## 0.2.1

### Patch Changes

- [`1b7d379`](https://github.com/Fantomiald/sketchyicons/commit/1b7d379b17a3619bfd34f24474b4c4ba19abdf9a) Thanks [@Fantomiald](https://github.com/Fantomiald)! - Release the six packages on one version number from here on.

  They all draw the same icons from the same geometry, so two packages at the same
  number are the same drawings. Under independent versions a reader had no way to
  tell that @sketchyicons/react 0.1.1 and @sketchyicons/vue 0.2.0 carried an
  identical catalogue.

## 0.1.1

### Patch Changes

- [`282e6f9`](https://github.com/Fantomiald/sketchyicons/commit/282e6f9cd4084f9a02aa8ee08ded2b4d3542e5dc) Thanks [@Fantomiald](https://github.com/Fantomiald)! - Point homepage at sketchyicons.com rather than at the package directory on
  GitHub, so the link on the npm page reaches the catalogue.

## 0.1.0

### Minor Changes

- [`21a7b55`](https://github.com/Fantomiald/sketchyicons/commit/21a7b55e81fa278c954e0ea936d9dc062402988c) Thanks [@Fantomiald](https://github.com/Fantomiald)! - First release. 1756 icons, geometry derived from Lucide 1.27.0 and drawn by a
  generator: straight runs bow, coordinates drift, and the drift is seeded from the
  icon name, so two builds are byte identical.

  How much hand a shape takes is measured from its own geometry. A coordinate
  cannot wander further than the shorter of the two runs meeting at it, and an icon
  built from straight runs and nothing else keeps a low amplitude. No icon is
  sorted by hand.

  The props match Lucide's and the 247 names Lucide has renamed are exported
  alongside the new ones, so migrating is an import change and nothing else.

  One icon imported from the barrel weighs 429 bytes minified and brotlied.
