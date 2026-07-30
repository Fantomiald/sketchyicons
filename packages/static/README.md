# @sketchyicons/static

[sketchyicons](https://github.com/Fantomiald/sketchyicons) as raw SVG files
and a sprite. No JavaScript, no build step.

```sh
npm install @sketchyicons/static
```

This is what makes the set usable outside JavaScript, from Flutter, SwiftUI,
Figma or plain HTML.

## What is in it

| Path               | What it holds                                     |
| ------------------ | ------------------------------------------------- |
| `icons/<name>.svg` | one file per icon, ready to drop anywhere         |
| `sprite.svg`       | every icon as a `symbol`, for `use`               |
| `icons.json`       | the geometry, in Lucide's `icon-nodes.json` shape |

## Use

One file:

```html
<img src="node_modules/@sketchyicons/static/icons/house.svg" width="20" alt="" />
```

The sprite, which is the one to reach for when a page shows more than a few
icons. Inline it once, then reference by name. The stroke follows `color`
because every symbol strokes with `currentColor`:

```html
<svg width="20" height="20" style="color: #2B2521"><use href="#house" /></svg>
```

The geometry, for a tool of your own. `icons.json` has the same shape as
Lucide's `icon-nodes.json`, so a script written against theirs reads ours
without a change:

```json
{ "house": [["path", { "d": "M14.72 21.05Q16.02 17 ..." }]] }
```

## Reading at 15 pixels

Every icon draws on a `0 0 24 24` viewBox with a 2 unit stroke, round capped and
round joined. At 15 pixels that stroke lands at 1.25, which is where a drawn
line stops reading as one. If your interface goes below 15, check it rather than
assume it.

## Licence

MIT for the code, see `LICENSE`. The geometry is derived from
[Lucide](https://lucide.dev) and keeps Lucide's ISC terms, see `NOTICE`. Not
affiliated with Lucide.
