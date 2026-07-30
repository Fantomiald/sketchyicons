# @sketchyicons/angular

Hand drawn icons for Angular. The geometry is derived from
[Lucide](https://lucide.dev), and a generator adds the hand.

```sh
npm install @sketchyicons/angular
```

Angular 21 is the only peer dependency, `@angular/core` and `@angular/common`.

## Use

One component draws them all, and the icon is an input:

```ts
import { Component } from '@angular/core';
import { SketchyIconComponent, House, Star } from '@sketchyicons/angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [SketchyIconComponent],
  template: `
    <sketchy-icon [img]="House" [size]="20" />
    <sketchy-icon [img]="Star" [size]="15" color="#2B2521" [strokeWidth]="1.75" />
  `,
})
export class HeaderComponent {
  protected readonly House = House;
  protected readonly Star = Star;
}
```

The other targets in this project generate a component per icon, because their
frameworks make that free. Angular compiles a template and a decorator for every
component, so 1756 of them would be 1756 things for the compiler to work through
in every consumer's build. The icons stay data and one component draws them.

Icons are plain constants with no side effects, so a bundler drops the ones you
did not import. One icon costs 3.5 kB against 901 kB for the whole catalogue.

## Inputs

| Input                 | Type               | Default        | What it does                                             |
| --------------------- | ------------------ | -------------- | -------------------------------------------------------- |
| `img`                 | `IconNode`         | required       | the icon to draw                                         |
| `size`                | `number \| string` | `24`           | width and height in one input                            |
| `color`               | `string`           | `currentColor` | the stroke                                               |
| `strokeWidth`         | `number \| string` | `2`            | stroke width, in viewBox units                           |
| `absoluteStrokeWidth` | `boolean`          | `false`        | keeps the stroke the same visual width whatever the size |

The component is `OnPush` and standalone, so it goes straight in `imports`.

## Coming from Lucide

The 247 names Lucide has renamed are exported alongside the new ones, so `Home`,
`HelpCircle` and `MoreHorizontal` still resolve.

```diff
-import { LucideAngularModule, Home } from 'lucide-angular';
+import { SketchyIconComponent, Home } from '@sketchyicons/angular';
```

The shape differs: Lucide ships a module and a component named `lucide-angular`,
this ships a standalone component named `sketchy-icon`. The icon data is the
same shape, so `[img]` takes either.

## Licence

MIT for the code, see `LICENSE`. The geometry is derived from Lucide and keeps
Lucide's ISC terms, see `NOTICE`. Not affiliated with Lucide.
