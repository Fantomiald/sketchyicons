---
'@sketchyicons/react-native': patch
'@sketchyicons/static': patch
'@sketchyicons/react': patch
'@sketchyicons/data': patch
'@sketchyicons/vue': patch
'sketchyicons': patch
---

Release the six packages on one version number from here on.

They all draw the same icons from the same geometry, so two packages at the same
number are the same drawings. Under independent versions a reader had no way to
tell that @sketchyicons/react 0.1.1 and @sketchyicons/vue 0.2.0 carried an
identical catalogue.
