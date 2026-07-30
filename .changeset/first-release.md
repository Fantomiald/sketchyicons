---
'@sketchyicons/react-native': minor
'@sketchyicons/static': minor
'@sketchyicons/react': minor
'@sketchyicons/data': minor
---

First release. 1756 icons, geometry derived from Lucide 1.27.0 and drawn by a
generator: straight runs bow, coordinates drift, and the drift is seeded from the
icon name, so two builds are byte identical.

How much hand a shape takes is measured from its own geometry. A coordinate
cannot wander further than the shorter of the two runs meeting at it, and an icon
built from straight runs and nothing else keeps a low amplitude. No icon is
sorted by hand.

The props match Lucide's and the 247 names Lucide has renamed are exported
alongside the new ones, so migrating is an import change and nothing else.

One icon imported from the barrel weighs 429 bytes minified and brotlied.
