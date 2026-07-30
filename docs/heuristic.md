# How much hand an icon takes

The generator used to sort every icon by hand into three drift buckets, 0.14,
0.4 and 0.8. That works at 84 icons and does not work at 1756. This is what
replaced it, and what the replacement can and cannot do.

## The two rules

Both are measured from the geometry. Neither is a list of names.

**1. The run bounds the drift.** A coordinate is shared by two runs, and it
cannot wander further than the shorter of them and still be that coordinate.

```
drift at a vertex = clamp(shorter adjacent run * 0.25, 0.01, 0.60)
```

A run of 2.4 units or more takes the full amplitude. A run of 0.01 unit does not
move. The bow is bounded the same way: a control point sits at most half a run
off the chord, so a short run cannot bow further than it is long.

**2. A subpath with no curve keeps its amplitude low.** A subpath that contains
no `C` or `Q` is a geometric figure: an arrow, a chevron, a cross, an equals
sign. Its identity is its exactness, so a wobble reads as broken rather than as
drawn. It draws at drift 0.21 and bow 0.24 instead of 0.6 and 0.6.

The rule reads each subpath rather than the whole icon, so the plus inside
`circle-plus` is held to a ruler while the circle around it is not. 159 of
Lucide 1.27.0's 1756 icons are built this way throughout.

## Why rule 1 is the right rule

The bucket sort had two known failures, `quote` and `smile-plus`, both demoted
by hand. `smile-plus` draws its eyes as 0.01 unit lines and `quote` sets its
marks as 1 unit runs between arcs. At a flat drift of 0.4 the eyes moved forty
times their own length.

Rule 1 reproduces both demotions from the geometry alone, with no name in the
code. `quote`'s 1 unit runs land at drift 0.167, close to the 0.14 the hand
demotion gave it, and `smile-plus`'s eyes land on the 0.01 floor while its 6 unit
cross keeps the full amplitude. Per icon, the bucket sort could only pick one of
those two.

The saturation length of 2.4 units is what puts `quote` where the hand put it.

## Arcs are read as curves

An arc's shape lives in `rx` and `ry`, and nudging either turns a smooth sweep
into a kink. So an arc could only ever have its endpoints drifted, never bowed.

That would be a detail if Lucide used a few. It does not:

| Share of the catalogue's drawn length |                 |
| ------------------------------------- | --------------- |
| arcs                                  | 20.4%           |
| cubics and quadratics                 | 14.0%           |
| straight runs                         | 65.6%           |
| **icons whose curvature is all arcs** | **972 of 1756** |

`cloud`, `fish` and `flame` are among them, and they came out of the generator
looking like the original with a tremble. So arcs are read as cubic beziers at
parse time, following the SVG 1.1 endpoint to centre conversion. A bezier has no
radii to protect, so it bows like any other curve.

The approximation is exact at both ends and off by about three ten thousandths of
the radius in between, well under the two decimals the output is rounded to. It
costs about 30 percent on the packed size of the react package, 283 kB against
216 kB for all 1756 icons, and nothing at all on a consumer importing a few.

## Curves bow, and their tension varies

A straight run bows by putting its control point off the midpoint. A curve had no
equivalent and took drift on its points and nothing else, which is a tremble
rather than a hand.

Both control points now move the same way across the chord, which makes the curve
fuller or flatter rather than wavy, and the distance they sit from their anchors
varies by up to 16 percent. Both scale with the amplitude in force.

## A closing stroke does not land where it started

A closepath lands exactly on the point the subpath began at, which is the one
thing a hand never does. It overshoots and leaves a crossing, or falls short and
leaves a gap. Every circle in the catalogue closed perfectly until the closing
stroke was allowed to carry past, along the direction the pen is travelling as it
arrives, by up to 1.25 times the drift and never more than a third of the run it
closes on.

## How much hand, and why that much

The amplitude is half again the 0.4 and 0.75 the 84 reference icons shipped at.
Those were set inside an application at 15 to 24 pixels, where restraint was the
point. Laid out as a catalogue they read as Lucide with a tremble.

The level was picked by looking at the same 28 icons at five amplitudes side by
side rather than argued. It leaves the drawing about 1.3 percent of the grid away
from Lucide's, against 0.9 before:

| Deviation from Lucide's path, units on the 24 grid |      |
| -------------------------------------------------- | ---- |
| p10                                                | 0.21 |
| median                                             | 0.31 |
| p90                                                | 0.40 |

## Why rule 2 only recovers ten of the thirty two quiet icons

The old `QUIET` bucket held 32 of the 84 references and `LOOSE` held 5. Rule 2
recovers the 10 that contain no curve at all. The other 27 are not recoverable,
and this was checked rather than assumed.

Measured over the 84, per bucket:

| Bucket | Icons | Mean curvature | Mean shortest run | Mean median run |
| ------ | ----- | -------------- | ----------------- | --------------- |
| quiet  | 34    | 0.47           | 5.19              | 9.23            |
| some   | 45    | 0.40           | 2.12              | 5.65            |
| loose  | 5     | 0.47           | 1.56              | 5.90            |

Curvature does not separate them at all. The run lengths trend but overlap
heavily: `ellipsis` is quiet with a shortest run of 1.41, `globe` is `some` with
14.14, `crown` is loose with 0.88. Segment count, subpath count and total path
length were checked too, with the same result.

Curvature exactly zero is the one clean cut. It holds for all 10 zero curvature
icons in `quiet` and for none of the 45 in `some` or the 5 in `loose`.

So the rest of the bucket sort was a judgement about how familiar a shape is,
not a property of the shape. Encoding taste as a fake measurement would be
worse than dropping it, so it is dropped: those 27 icons draw at the common
amplitude. 24 get more hand than before and 5 get less.

## Calibration, Lucide 1.27.0

Run lengths are chords on the 24 grid. A closepath that lands on the point it
started from covers no distance, so it is not counted as a run.

| Measurement                        | Value |
| ---------------------------------- | ----- |
| icons                              | 1756  |
| shortest run per icon, p10         | 0.30  |
| shortest run per icon, p25         | 1.00  |
| shortest run per icon, median      | 1.60  |
| shortest run per icon, p75         | 2.83  |
| shortest run per icon, p90         | 5.66  |
| icons with a run under 1 unit      | 397   |
| icons with a run under 0.1 unit    | 161   |
| implicit commands                  | 2381  |
| icons drawn at the ruler amplitude | 159   |
| exotic path commands               | 0     |

These differ from the figures in the starting brief, which were taken on an
earlier Lucide and before rounded rects were handled. Rects contribute arcs and
short corner runs that the earlier pass did not see.

## What the generator refuses

`react-native-svg` does not report a malformed path. The icon does not
appear, with no error anywhere. So every drawn path is walked the way a renderer
walks it, and the build stops on any of these:

- the path does not open with a moveto
- a command the parser does not know, or a token that is not a number
- a different number of commands out than in, or a command rewritten into
  something it is not allowed to become
- a coordinate that leaves the frame the icon is allowed to occupy
- a coordinate that moved further than the amplitude permits
- an arc whose radii changed
- a run that collapsed to under a quarter of its length

## Traps in Lucide's own path data

Four, all of them live in the current catalogue.

**Numbers that run together.** `3.5.7` is 3.5 then 0.7, and `.6.4` is 0.6 then
0.4. A greedy digits-and-dots class reads both as one token, which becomes
`NaN`.

**Arc flags butted against the coordinate that follows.** `a2 2 0 001.999-2` is
large 0, sweep 0, x 1.999, y -2. A flag is one character wide and SVG lets it
sit flush against the next number. Reading it as a number swallows three values
at once and every arc after it lands somewhere else. 20 icons are written this
way, `book-open` and `feather` among the 84 references. The parser reads flags
character by character.

**Smooth commands after a straight run.** 22 icons write an `s` straight after a
moveto, `smile-plus` among them, where the first control point is the current
point. The roughener rewrites straight runs as quadratics, so an `S` or a `T`
left implicit would reflect against a control point that did not exist in the
source. The parser writes both control points out, so the reflection is fixed
before the hand is applied.

**Geometry outside the frame.** `save-off` carries a stray run at x 29.5 that the
renderer clips and nobody sees. Clamping it into view would add a stroke the
original does not draw, so the frame margin only applies where the source already
respects it.

And one trap in Lucide's elements rather than its paths: 396 of its 397 `rect`
elements carry `rx` or `ry`. Squaring those corners would show on every framed
icon in the set.

## Correcting one icon

A drawing is decided by the icon's name and by the two rules above, which is what
makes a rebuild reproduce it exactly. The cost is that running the generator
again gives back the same glyph, so there is no way to redraw one icon by
rerunning anything.

`packages/data/overrides.json` is the escape hatch, and the only place a human
judgement about a drawing is written down. It holds the amplitude the whole
catalogue starts from as well, because that is a drawing decision too.

```json
{
  "hand": { "drift": 0.6, "bow": 1.13 },
  "icons": {
    "smile-plus": { "seed": 2, "why": "the eyes landed on top of each other" },
    "crown": { "drift": 0.9, "bow": 1.6, "why": "too calm for a crown" }
  }
}
```

Nobody writes that file by hand. `node tools/build-tuner.mjs` produces a page
that draws all 1756 icons in the browser with the two knobs on sliders, one pair
for the catalogue and one pair per icon, and a button that exports exactly this
file. The roughener is inlined into the page rather than reimplemented, so what
the sliders show is what `pnpm generate` writes, to the byte.
`tests/browser.test.mjs` draws the whole catalogue both ways and compares.

| Knob    | Range    | What it does                                                                                          |
| ------- | -------- | ----------------------------------------------------------------------------------------------------- |
| `seed`  | 1 to 999 | draws the same shape from a different sequence, for when the amplitude is right and the throw was not |
| `drift` | 0 to 1.2 | replaces the drift amplitude for this icon                                                            |
| `bow`   | 0 to 3   | replaces the bow amplitude for this icon                                                              |
| `why`   | required | the reason, so a later reader can tell whether it still applies                                       |

The generator refuses an override on an icon Lucide no longer has, a knob it does
not know, a value outside its range, an entry with no `why`, and a `why` with no
knob.

An icon with no override draws byte for byte as it did before the file existed,
and an override on one icon cannot reach another: the sequence is seeded per
icon. `pnpm test` asserts both.

The workflow is: move the sliders until the drawing is right, export, drop the
file in `packages/data`, run `pnpm generate`. It redraws all 1756 in under a
second and the diff shows only the icons that changed, so the diff is the review.
