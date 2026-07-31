# @sketchyicons/angular

## 0.5.0

## 0.4.0

### Minor Changes

- [`5a9225a`](https://github.com/Fantomiald/sketchyicons/commit/5a9225a72411a33b62e76951a2cd7375a4b8538d) Thanks [@Fantomiald](https://github.com/Fantomiald)! - Take the bow down from 1.13 to 0.6. Every icon is drawn differently.

  The bow is how far a stroke swells between its two ends. It was raised alongside
  the drift when the catalogue read as too close to Lucide, and seen inside a real
  application it went too far the other way: a rounded rectangle whose sides bow
  reads as a mistake rather than as a hand, because the eye knows what a rectangle
  is. Curves never needed that much either.

  The drift is untouched at 0.6, so coordinates wander exactly as before. RULER
  comes down with it, from 0.45 to 0.24, so a subpath of straight runs keeps the
  same 40 percent share of the bow it had.

  The drawing now sits 1.1 percent of the grid away from Lucide's, against 1.3.
  1754 of the 1756 icons changed.

## 0.3.0

### Minor Changes

- [`c5f85c7`](https://github.com/Fantomiald/sketchyicons/commit/c5f85c7aff88b01048a435838b22798041343fe5) Thanks [@Fantomiald](https://github.com/Fantomiald)! - Angular, built the way Angular wants: one standalone component that takes the
  icon as an input, and the icons as data.

  The other targets generate a component per icon because their frameworks make
  that free. Angular compiles a template and a decorator for every component, so
  1756 of them would be 1756 things for the compiler to work through in every
  consumer's build. `@lucide/angular` takes the same route.

  Angular 21 is the peer dependency, and the package ships in the Angular Package
  Format that `ng-packagr` produces. One icon costs 3.5 kB against 901 kB for the
  whole catalogue.
