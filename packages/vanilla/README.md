# sketchyicons

Hand drawn icons for the DOM, with no framework. The geometry is derived from
[Lucide](https://lucide.dev), and a generator adds the hand.

```sh
npm install sketchyicons
```

No dependencies at all, runtime or peer.

## Use

Build an element and put it where you want it:

```js
import { createElement, House } from 'sketchyicons';

document.querySelector('.header').append(createElement(House, { width: 20, height: 20 }));
```

Or write the names in the markup and replace them in one pass:

```html
<i data-sketchy="house"></i>
<i data-sketchy="star" width="15" stroke="#2B2521"></i>

<script type="module">
  import { createIcons, House, Star } from 'sketchyicons';
  createIcons({ icons: { House, Star } });
</script>
```

An attribute on the element wins over the shared ones, so a single icon is sized
or coloured in the markup. An element naming an icon you did not hand over is
left alone.

Only the icons you import are drawn, so a page pays for what it uses. Handing
over every icon means shipping every icon. One icon and `createElement` together
cost 450 bytes minified and brotlied.

## Attributes

Written in SVG's own spelling, `stroke-width` and not `strokeWidth`, because
this returns a DOM node rather than a framework's idea of one.

| Attribute                           | Default        |
| ----------------------------------- | -------------- |
| `width`, `height`                   | `24`           |
| `viewBox`                           | `0 0 24 24`    |
| `stroke`                            | `currentColor` |
| `stroke-width`                      | `2`            |
| `fill`                              | `none`         |
| `stroke-linecap`, `stroke-linejoin` | `round`        |

Anything you pass is merged over these.

## What it exports

| Export                                          | What it is                                         |
| ----------------------------------------------- | -------------------------------------------------- |
| `House`, `Star`, one per icon                   | the geometry, as `IconNode`                        |
| `createElement(icon, attrs)`                    | an `SVGElement`                                    |
| `createIcons({ icons, attrs, nameAttr, root })` | replaces every element carrying the name attribute |

`createIcons` defaults to `data-sketchy` and the whole document. It throws
rather than doing nothing quietly when handed no icons.

`IconNode` is the shape Lucide uses, so their `createLucideIcon` accepts one of
ours unchanged.

## Coming from Lucide

The 247 names Lucide has renamed are exported alongside the new ones, so `Home`,
`HelpCircle` and `MoreHorizontal` still resolve.

```diff
-import { createIcons, Home } from 'lucide';
+import { createIcons, Home } from 'sketchyicons';
```

## Licence

MIT for the code, see `LICENSE`. The geometry is derived from Lucide and keeps
Lucide's ISC terms, see `NOTICE`. Not affiliated with Lucide.
