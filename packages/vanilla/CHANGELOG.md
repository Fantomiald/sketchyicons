# sketchyicons

## 0.2.1

### Patch Changes

- [`1b7d379`](https://github.com/Fantomiald/sketchyicons/commit/1b7d379b17a3619bfd34f24474b4c4ba19abdf9a) Thanks [@Fantomiald](https://github.com/Fantomiald)! - Release the six packages on one version number from here on.

  They all draw the same icons from the same geometry, so two packages at the same
  number are the same drawings. Under independent versions a reader had no way to
  tell that @sketchyicons/react 0.1.1 and @sketchyicons/vue 0.2.0 carried an
  identical catalogue.

## 0.2.0

### Minor Changes

- [`7408b59`](https://github.com/Fantomiald/sketchyicons/commit/7408b59e5590bbd61555c8a99ce8a5cc8ca9188c) Thanks [@Fantomiald](https://github.com/Fantomiald)! - Two new targets, both generated from the same geometry as the others.

  `@sketchyicons/vue` renders through Vue's render function. Icons are functional
  components, so they hold no state and cost a render call. `vue` 3 is the only
  peer dependency.

  `sketchyicons`, unscoped, is the DOM target and has no dependencies at all. It
  exports the geometry rather than components, plus `createElement` for one icon
  and `createIcons` to replace every element carrying a `data-sketchy` attribute.
  An attribute written on the element wins over the shared ones, and an icon that
  was not handed over is left alone.

  Both carry the 247 names Lucide has renamed. One icon costs 464 bytes in Vue and
  453 in the DOM package, minified and brotlied.
