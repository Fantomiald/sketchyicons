---
'@sketchyicons/angular': minor
---

Angular, built the way Angular wants: one standalone component that takes the
icon as an input, and the icons as data.

The other targets generate a component per icon because their frameworks make
that free. Angular compiles a template and a decorator for every component, so
1756 of them would be 1756 things for the compiler to work through in every
consumer's build. `@lucide/angular` takes the same route.

Angular 21 is the peer dependency, and the package ships in the Angular Package
Format that `ng-packagr` produces. One icon costs 3.5 kB against 901 kB for the
whole catalogue.
