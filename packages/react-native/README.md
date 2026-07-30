# @sketchyicons/react-native

Hand drawn icons for React Native, over `react-native-svg`. The geometry is
derived from [Lucide](https://lucide.dev), and a generator adds the hand.

```sh
npm install @sketchyicons/react-native react-native-svg
```

`react` 18 or 19 and `react-native-svg` 13 or later are the only peer
dependencies. There are no runtime dependencies.

## Use

```tsx
import { House, Star } from '@sketchyicons/react-native';

export const Header = () => (
  <View style={styles.row}>
    <House size={20} />
    <Star size={15} color="#2B2521" strokeWidth={1.75} fill="currentColor" />
  </View>
);
```

One icon per file, so importing one does not pull in the rest. A single icon
costs 755 bytes minified and brotlied.

## Coming from Lucide

Swap the package name. The props are the same, and the 247 names Lucide has
renamed are exported alongside the new ones.

```diff
-import { Home, HelpCircle } from 'lucide-react-native';
+import { Home, HelpCircle } from '@sketchyicons/react-native';
```

```tsx
import { House } from '@sketchyicons/react-native';
import House from '@sketchyicons/react-native/icons/house';
```

## Props

The props match Lucide's, so migrating is an import change and nothing else.

| Prop                  | Type               | Default        | What it does                                             |
| --------------------- | ------------------ | -------------- | -------------------------------------------------------- |
| `size`                | `number \| string` | `24`           | width and height in one prop                             |
| `color`               | `string`           | `currentColor` | the stroke                                               |
| `strokeWidth`         | `number \| string` | `2`            | stroke width, in viewBox units                           |
| `absoluteStrokeWidth` | `boolean`          | `false`        | keeps the stroke the same visual width whatever the size |
| `fill`                | `string`           | `none`         | fills the shape                                          |

Anything else is forwarded to `react-native-svg`'s `Svg`, `style`,
`onPress`, `testID` and the rest. The ref lands on the `Svg`.

`currentColor` is not a React Native concept, so pass a real colour when the
icon is not inside something that sets one.

## Your own icon

```tsx
import { createSketchyIcon } from '@sketchyicons/react-native';

const Squiggle = createSketchyIcon('Squiggle', [['path', { d: 'M2 12Q8 4 12 12T22 12' }]]);
```

The factory throws on an element `react-native-svg` has no component for.
`react-native-svg` drops what it does not understand without a word, and an icon
that silently fails to appear is the most tedious bug in this project.

## Licence

MIT for the code, see `LICENSE`. The geometry is derived from Lucide and keeps
Lucide's ISC terms, see `NOTICE`. Not affiliated with Lucide.
