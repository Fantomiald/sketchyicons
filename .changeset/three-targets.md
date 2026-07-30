---
'@sketchyicons/preact': minor
'@sketchyicons/svelte': minor
'@sketchyicons/solid': minor
---

Three more targets, all generated from the same geometry as the rest.

`@sketchyicons/preact` and `@sketchyicons/solid` are a component per icon, like
React and Vue. Preact writes SVG attributes in SVG's own spelling because it does
not rewrite the camel case form the way React does, and Solid is built with
`solid-js/h` so the package needs no compile step and reads its props reactively.

`@sketchyicons/svelte` ships one component and the icons as data, the shape the
Angular target takes: a Svelte component is a file the consumer's bundler
compiles, so 1756 of them would be 1756 compilations in every build. The
component travels uncompiled, as a Svelte package does.

All three carry the 247 names Lucide has renamed, and a test renders one icon
through every target and asserts they carry the same paths and export the same
names.
