# @sketchyicons/figma-plugin

A Figma plugin that inserts sketchyicons onto the canvas. Search by name or
by an older alias, click a result to insert it at the center of the current
viewport.

This package is private and does not publish to npm: it ships through Figma
Community.

## Develop

```sh
pnpm install
pnpm --filter @sketchyicons/figma-plugin build
```

`pnpm build` regenerates `src/generated/icons.json` from `packages/data/icons`
and then runs `build-figma-plugin`, which writes `manifest.json` and `build/`
at the package root. Neither is committed.

Use `pnpm --filter @sketchyicons/figma-plugin watch` while developing: it
rebuilds on every source change.

## Test locally in Figma

1. Run `pnpm --filter @sketchyicons/figma-plugin build`.
2. In Figma desktop, open the Figma menu, then Plugins, then Development,
   then "Import plugin from manifest...".
3. Select `packages/figma-plugin/manifest.json`.
4. Run the plugin from the same Development menu.

## Publish

Figma reviews every plugin before it is listed publicly. Before submitting:

- [ ] `pnpm --filter @sketchyicons/figma-plugin build` succeeds with no
      warnings
- [ ] the plugin has been run in Figma desktop at least once, with no
      crash and no developer-facing error message
- [ ] the `figma-plugin.id` field in `package.json` holds the real id
      Figma assigned, not the placeholder
- [ ] the listing description explains what the plugin does and links back
      to this README
- [ ] a support contact is set on the listing
- [ ] the plugin icon and cover image are in place
- [ ] the icon preview stays legible on both Figma's light and dark UI
      themes (checked when testing locally)

Figma's review guidelines are at
https://help.figma.com/hc/en-us/articles/360039958914-Plugin-and-widget-review-guidelines.
