# Sketchyicons Figma Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working, locally testable Figma plugin (`packages/figma-plugin`) that lets a designer search sketchyicons by name or alias and insert one onto the canvas.

**Architecture:** A new generator target (`tools/targets/figma-plugin.mjs`) turns the committed geometry in `packages/data/icons` into a single embedded JSON bundle with the `currentColor` stroke resolved to a solid default. The plugin itself is built with `create-figma-plugin`'s toolkit (Preact UI + esbuild), split into a pure, unit-tested search module and thin, untestable glue for the Figma sandbox API.

**Tech Stack:** TypeScript 5.9, `@create-figma-plugin/build` 4.0.3 (esbuild-based bundler, `build-figma-plugin` CLI), `@create-figma-plugin/ui` 4.0.3, `@create-figma-plugin/utilities` 4.0.3, Preact 10.29.8, `@figma/plugin-typings` 1.132.0, Vitest (repo-wide runner).

## Global Constraints

- Node `^20.19.0 || ^22.13.0 || >=24`, pnpm `10.34.5` (root `package.json`).
- Commits follow Conventional Commits with the closed scope list in `commitlint.config.js`; no tool attribution in any commit, changeset, or comment (`CONTRIBUTING.md`).
- No em dash or en dash anywhere in committed text (`commitlint.config.js`'s `no-dash-punctuation` rule, `CONTRIBUTING.md`'s writing style section).
- `pnpm exec prettier --check --cache .` and `eslint .` must pass before every commit (Husky pre-commit hook).
- TypeScript strict mode, `noUncheckedIndexedAccess`, `verbatimModuleSyntax` (`tsconfig.base.json`), unless a leaf `tsconfig.json` deliberately overrides a specific option for the Figma toolkit.
- No generated file is committed, apart from `packages/data/icons` (`CONTRIBUTING.md`).
- The plugin makes no network request: `networkAccess.allowedDomains` is `["none"]`.
- Default resolved stroke color is `#17130e`, the "Ink" swatch already used as the icon default on `sketchyicons.com` (`web/src/lib/color.ts:10`).
- `packages/figma-plugin` is `private: true` and carries no `publishConfig`: it ships through Figma Community, not npm, and is excluded from the Changesets `fixed` group in `.changeset/config.json`.

---

### Task 1: The `figma-plugin` generator target

**Files:**

- Create: `tools/targets/figma-plugin.mjs`
- Modify: `tools/build-targets.mjs`
- Modify: `.gitignore`
- Modify: `eslint.config.js`
- Test: `tests/figma-plugin-target.test.mjs`

**Interfaces:**

- Consumes: `readIcons()`, `readAliases(icons)`, `attributesOf(path)` from `tools/lib/icons.mjs` (existing, unchanged).
- Produces: a target object with the same shape every file under `tools/targets` exports (`{ name, package, clean, files(icons) }`, see `tools/targets/static.mjs`), registered in `tools/build-targets.mjs`'s `TARGETS` array. Running `node tools/build-targets.mjs --target figma-plugin` writes `packages/figma-plugin/src/generated/icons.json` shaped:

  ```ts
  {
    icons: Record<string, string>;
    aliases: Record<string, string>;
  }
  ```

  Task 2 imports this file by that exact path and shape.

- [ ] **Step 1: Write the failing test**

  Create `tests/figma-plugin-target.test.mjs`:

  ```js
  import { execFileSync } from 'node:child_process';
  import { existsSync, readFileSync, rmSync } from 'node:fs';
  import { describe, expect, it } from 'vitest';

  describe('the figma-plugin target', () => {
    it('writes a bundle with a solid stroke and the alias map', () => {
      rmSync('packages/figma-plugin/src/generated', { recursive: true, force: true });
      execFileSync('node', ['tools/build-targets.mjs', '--target', 'figma-plugin'], {
        stdio: 'inherit',
      });

      expect(existsSync('packages/figma-plugin/src/generated/icons.json')).toBe(true);
      const bundle = JSON.parse(
        readFileSync('packages/figma-plugin/src/generated/icons.json', 'utf8'),
      );

      expect(bundle.icons.house).toContain('stroke="#17130e"');
      expect(bundle.icons.house).not.toContain('currentColor');
      expect(bundle.aliases['activity-square']).toBe('square-activity');
    });
  });
  ```

- [ ] **Step 2: Run the test and confirm it fails**

  Run: `pnpm exec vitest run tests/figma-plugin-target.test.mjs`
  Expected: FAIL. `execFileSync` throws because `node tools/build-targets.mjs --target figma-plugin` exits 1 with `unknown target "figma-plugin", pick one of data static react ...`.

- [ ] **Step 3: Write the target**

  Create `tools/targets/figma-plugin.mjs`:

  ```js
  // packages/figma-plugin: icon geometry as SVG strings a Figma plugin can
  // insert with figma.createNodeFromSvg, embedded at build time so the
  // plugin makes no network request.
  //
  // figma.createNodeFromSvg does not reliably resolve stroke="currentColor",
  // so this target writes a solid default instead of the shared attributes
  // the static target uses.

  import { attributesOf, readAliases } from '../lib/icons.mjs';

  const STROKE = '#17130e'; // the "Ink" default from web/src/lib/color.ts

  const SVG_ATTRIBUTES = [
    'xmlns="http://www.w3.org/2000/svg"',
    'width="24"',
    'height="24"',
    'viewBox="0 0 24 24"',
    'fill="none"',
    `stroke="${STROKE}"`,
    'stroke-width="2"',
    'stroke-linecap="round"',
    'stroke-linejoin="round"',
  ];

  const pathTags = (icon, indent) =>
    icon.paths
      .map((path) => {
        const attributes = Object.entries(attributesOf(path))
          .map(([key, value]) => `${key}="${value}"`)
          .join(' ');
        return `${indent}<path ${attributes} />`;
      })
      .join('\n');

  const svgOf = (icon) => `<svg ${SVG_ATTRIBUTES.join(' ')}>\n${pathTags(icon, '  ')}\n</svg>\n`;

  export default {
    name: 'figma-plugin',
    package: 'packages/figma-plugin',
    clean: ['src/generated'],

    /** @param {import('../lib/icons.mjs').Icon[]} icons */
    files(icons) {
      const bundle = {
        icons: Object.fromEntries(icons.map((icon) => [icon.name, svgOf(icon)])),
        aliases: Object.fromEntries(readAliases(icons).map((alias) => [alias.name, alias.target])),
      };
      return [{ path: 'src/generated/icons.json', content: `${JSON.stringify(bundle)}\n` }];
    },
  };
  ```

- [ ] **Step 4: Register the target**

  In `tools/build-targets.mjs`, add the import next to the other target imports:

  ```js
  import figmaPlugin from './targets/figma-plugin.mjs';
  ```

  And add it to the `TARGETS` array:

  ```js
  const TARGETS = [
    data,
    staticFiles,
    react,
    reactNative,
    vue,
    vanilla,
    angular,
    preact,
    solid,
    svelte,
    figmaPlugin,
  ];
  ```

- [ ] **Step 5: Run the test and confirm it passes**

  Run: `pnpm exec vitest run tests/figma-plugin-target.test.mjs`
  Expected: PASS.

- [ ] **Step 6: Keep the generated bundle and future build output out of git and lint**

  In `.gitignore`, add under the existing generated-files block:

  ```
  packages/figma-plugin/src/generated/
  packages/figma-plugin/manifest.json
  packages/figma-plugin/build/
  ```

  In `eslint.config.js`, add to the `ignores` array:

  ```js
  'packages/figma-plugin/src/generated/**',
  'packages/figma-plugin/build/**',
  ```

- [ ] **Step 7: Format, lint, commit**

  Run: `pnpm exec prettier --write tools/targets/figma-plugin.mjs tools/build-targets.mjs tests/figma-plugin-target.test.mjs .gitignore eslint.config.js`

  ```bash
  git add tools/targets/figma-plugin.mjs tools/build-targets.mjs tests/figma-plugin-target.test.mjs .gitignore eslint.config.js
  git commit -m "build(tools): add the figma-plugin generator target"
  ```

---

### Task 2: Scaffold the package, and the search module

**Files:**

- Create: `packages/figma-plugin/package.json`
- Create: `packages/figma-plugin/tsconfig.json`
- Create: `packages/figma-plugin/README.md`
- Create: `packages/figma-plugin/src/search.ts`
- Test: `packages/figma-plugin/tests/search.test.ts`
- Modify: `commitlint.config.js`

**Interfaces:**

- Consumes: nothing from earlier tasks except the generated bundle's _shape_ (not its content, `search.ts` takes plain data as arguments so it has no import-time dependency on Task 1's output).
- Produces:

  ```ts
  export interface SearchIndex {
    names: string[];
    aliases: Record<string, string>;
  }
  export function searchIcons(index: SearchIndex, query: string, limit: number): string[];
  ```

  Task 4's `ui.tsx` imports `searchIcons` and `SearchIndex` from `./search`.
  The workspace package name is `@sketchyicons/figma-plugin`, used by pnpm filters in every later step (`pnpm --filter @sketchyicons/figma-plugin <script>`).

- [ ] **Step 1: Add the package manifest**

  Create `packages/figma-plugin/package.json`:

  ```json
  {
    "name": "@sketchyicons/figma-plugin",
    "version": "0.0.1",
    "private": true,
    "description": "Figma plugin that inserts sketchyicons onto the canvas",
    "license": "MIT",
    "type": "module",
    "figma-plugin": {
      "editorType": ["figma"],
      "id": "0",
      "name": "Sketchy Icons",
      "main": "src/main.ts",
      "ui": "src/ui.tsx",
      "networkAccess": {
        "allowedDomains": ["none"]
      }
    },
    "scripts": {
      "generate": "node ../../tools/build-targets.mjs --target figma-plugin",
      "build": "pnpm generate && build-figma-plugin --typecheck --minify",
      "watch": "pnpm generate && build-figma-plugin --typecheck --watch",
      "typecheck": "tsc -p tsconfig.json --noEmit"
    },
    "dependencies": {
      "@create-figma-plugin/ui": "4.0.3",
      "@create-figma-plugin/utilities": "4.0.3",
      "preact": "10.29.8"
    },
    "devDependencies": {
      "@create-figma-plugin/build": "4.0.3",
      "@create-figma-plugin/tsconfig": "4.0.3",
      "@figma/plugin-typings": "1.132.0"
    },
    "repository": {
      "type": "git",
      "url": "git+https://github.com/Fantomiald/sketchyicons.git",
      "directory": "packages/figma-plugin"
    },
    "homepage": "https://sketchyicons.com"
  }
  ```

  `id: "0"` is a placeholder. It works for local development (see the manual steps at the end of this plan) and gets replaced once you create the real plugin entry in Figma.

- [ ] **Step 2: Add the package tsconfig**

  Create `packages/figma-plugin/tsconfig.json`:

  ```json
  {
    "extends": ["../../tsconfig.base.json", "@create-figma-plugin/tsconfig"],
    "compilerOptions": {
      "noEmit": true,
      "resolveJsonModule": true,
      "typeRoots": ["./node_modules/@types", "./node_modules/@figma"]
    },
    "include": ["src"]
  }
  ```

  The array form of `extends` applies `tsconfig.base.json` first and lets `@create-figma-plugin/tsconfig` win on the options both files set (`jsx`, `module`, `moduleResolution`), which the Preact-based UI toolkit requires.

- [ ] **Step 3: Install dependencies**

  Run: `pnpm install`
  Expected: pnpm resolves the new workspace member (matched by the existing `packages/*` glob in `pnpm-workspace.yaml`, no config change needed) and installs `@create-figma-plugin/*`, `@figma/plugin-typings`, and `preact`.

- [ ] **Step 4: Write the failing search test**

  Create `packages/figma-plugin/tests/search.test.ts`:

  ```ts
  import { describe, expect, it } from 'vitest';

  import { searchIcons, type SearchIndex } from '../src/search';

  const index: SearchIndex = {
    names: ['house', 'square-activity', 'rabbit'],
    aliases: { 'activity-square': 'square-activity' },
  };

  describe('searchIcons', () => {
    it('returns every name for an empty query, up to the limit', () => {
      expect(searchIcons(index, '', 2)).toEqual(['house', 'square-activity']);
    });

    it('matches a name directly', () => {
      expect(searchIcons(index, 'rabbit', 10)).toEqual(['rabbit']);
    });

    it('matches an old name through its alias', () => {
      expect(searchIcons(index, 'activity-square', 10)).toEqual(['square-activity']);
    });

    it('caps the result count at the limit', () => {
      expect(searchIcons(index, '', 1)).toHaveLength(1);
    });
  });
  ```

- [ ] **Step 5: Run the test and confirm it fails**

  Run: `pnpm exec vitest run packages/figma-plugin/tests/search.test.ts`
  Expected: FAIL, `Cannot find module '../src/search'`.

- [ ] **Step 6: Implement the search module**

  Create `packages/figma-plugin/src/search.ts`:

  ```ts
  export interface SearchIndex {
    names: string[];
    aliases: Record<string, string>;
  }

  export function searchIcons(index: SearchIndex, query: string, limit: number): string[] {
    const trimmed = query.trim().toLowerCase();
    if (trimmed === '') return index.names.slice(0, limit);

    const aliasedTargets = new Set(
      Object.entries(index.aliases)
        .filter(([alias]) => alias.includes(trimmed))
        .map(([, target]) => target),
    );
    const found = index.names.filter((name) => name.includes(trimmed) || aliasedTargets.has(name));
    return found.slice(0, limit);
  }
  ```

- [ ] **Step 7: Run the test and confirm it passes**

  Run: `pnpm exec vitest run packages/figma-plugin/tests/search.test.ts`
  Expected: PASS.

- [ ] **Step 8: Add the plugin's commit scope**

  In `commitlint.config.js`, add `'figma-plugin'` to the `scope-enum` array (alongside `'vanilla'`, before `'tools'`).

- [ ] **Step 9: Add a starting README**

  Create `packages/figma-plugin/README.md`:

  ````md
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
  ````

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

  ```

  ```

- [ ] **Step 10: Format, lint, typecheck, commit**

  Run: `pnpm exec prettier --write packages/figma-plugin commitlint.config.js`
  Run: `pnpm --filter @sketchyicons/figma-plugin typecheck`
  Expected: passes (only `src/search.ts` exists so far, and it does not touch the `figma` global).

  ```bash
  git add packages/figma-plugin commitlint.config.js
  git commit -m "feat(figma-plugin): scaffold the package and the search module"
  ```

---

### Task 3: The insertion handler

**Files:**

- Create: `packages/figma-plugin/src/types.ts`
- Create: `packages/figma-plugin/src/main.ts`

**Interfaces:**

- Consumes: `packages/figma-plugin/src/generated/icons.json` (Task 1's output, present after `pnpm generate`), shaped `{ icons: Record<string,string>, aliases: Record<string,string> }`.
- Produces:

  ```ts
  export interface InsertIconHandler extends EventHandler {
    name: 'INSERT_ICON';
    handler: (iconName: string) => void;
  }
  export interface Bundle {
    icons: Record<string, string>;
    aliases: Record<string, string>;
  }
  ```

  Task 4's `ui.tsx` imports both `InsertIconHandler` and `Bundle` from `./types`, and calls `emit<InsertIconHandler>('INSERT_ICON', name)`.

- [ ] **Step 1: Declare the shared event type**

  Create `packages/figma-plugin/src/types.ts`:

  ```ts
  import type { EventHandler } from '@create-figma-plugin/utilities';

  export interface InsertIconHandler extends EventHandler {
    name: 'INSERT_ICON';
    handler: (iconName: string) => void;
  }

  export interface Bundle {
    icons: Record<string, string>;
    aliases: Record<string, string>;
  }
  ```

- [ ] **Step 2: Write the plugin's main entry point**

  Create `packages/figma-plugin/src/main.ts`:

  ```ts
  import { on, showUI } from '@create-figma-plugin/utilities';

  import rawBundle from './generated/icons.json';
  import type { Bundle, InsertIconHandler } from './types';

  const bundle = rawBundle as Bundle;

  export default function () {
    on<InsertIconHandler>('INSERT_ICON', (iconName) => {
      const svg = bundle.icons[iconName];
      if (svg === undefined) return;

      const node = figma.createNodeFromSvg(svg);
      node.x = figma.viewport.center.x - node.width / 2;
      node.y = figma.viewport.center.y - node.height / 2;
      figma.currentPage.selection = [node];
      figma.viewport.scrollAndZoomIntoView([node]);
    });

    showUI({ width: 320, height: 480 });
  }
  ```

- [ ] **Step 3: Generate the bundle and typecheck**

  Run: `pnpm --filter @sketchyicons/figma-plugin generate`
  Run: `pnpm --filter @sketchyicons/figma-plugin typecheck`
  Expected: both pass. Typecheck resolves the `figma` global from `@figma/plugin-typings` through the `typeRoots` set in Task 2.

  This is the substitute for a unit test here: `main.ts` calls the real Figma plugin API (`figma.createNodeFromSvg`, `figma.viewport`, `figma.currentPage`), which only exists inside Figma's own sandbox and cannot be exercised outside it. Correctness of this file is checked by the type checker now and by hand in Figma in the last section of this plan.

- [ ] **Step 4: Format, lint, commit**

  Run: `pnpm exec prettier --write packages/figma-plugin/src/types.ts packages/figma-plugin/src/main.ts`

  ```bash
  git add packages/figma-plugin/src/types.ts packages/figma-plugin/src/main.ts
  git commit -m "feat(figma-plugin): insert an icon at the viewport center on request"
  ```

---

### Task 4: The search UI

**Files:**

- Create: `packages/figma-plugin/src/ui.tsx`

**Interfaces:**

- Consumes: `searchIcons`, `SearchIndex` from `./search` (Task 2); `InsertIconHandler`, `Bundle` from `./types` (Task 3); `packages/figma-plugin/src/generated/icons.json` (Task 1).
- Produces: the plugin's default UI export, `build-figma-plugin`'s only entry point for `src/ui.tsx`. Nothing later in this plan imports from this file.

- [ ] **Step 1: Write the UI**

  Create `packages/figma-plugin/src/ui.tsx`:

  ```tsx
  import { Container, Muted, render, Text, Textbox, VerticalSpace } from '@create-figma-plugin/ui';
  import { emit } from '@create-figma-plugin/utilities';
  import { h } from 'preact';
  import { useMemo, useState } from 'preact/hooks';

  import rawBundle from './generated/icons.json';
  import { searchIcons, type SearchIndex } from './search';
  import type { Bundle, InsertIconHandler } from './types';

  const bundle = rawBundle as Bundle;
  const index: SearchIndex = { names: Object.keys(bundle.icons).sort(), aliases: bundle.aliases };
  const RESULT_LIMIT = 60;

  function Plugin() {
    const [query, setQuery] = useState('');
    const results = useMemo(() => searchIcons(index, query, RESULT_LIMIT), [query]);

    function insert(name: string) {
      emit<InsertIconHandler>('INSERT_ICON', name);
    }

    return (
      <Container space="medium">
        <VerticalSpace space="small" />
        <Textbox onValueInput={setQuery} placeholder="Search icons" value={query} />
        <VerticalSpace space="small" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))',
            gap: '4px',
          }}
        >
          {results.map((name) => (
            <button
              key={name}
              title={name}
              onClick={() => insert(name)}
              style={{
                width: '32px',
                height: '32px',
                padding: '4px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
              dangerouslySetInnerHTML={{ __html: bundle.icons[name] ?? '' }}
            />
          ))}
        </div>
        {results.length === RESULT_LIMIT ? (
          <Text>
            <Muted>Showing the first {RESULT_LIMIT} matches. Refine your search for more.</Muted>
          </Text>
        ) : null}
      </Container>
    );
  }

  export default render(Plugin);
  ```

  The search and match logic already has its own test (Task 2). This file is thin glue between that tested logic, the generated bundle, and `@create-figma-plugin/ui` components, so it carries no dedicated test of its own, consistent with `main.ts` in Task 3.

- [ ] **Step 2: Build the whole plugin and confirm the toolchain agrees**

  Run: `pnpm --filter @sketchyicons/figma-plugin build`
  Expected: succeeds, and creates `packages/figma-plugin/manifest.json`, `packages/figma-plugin/build/main.js`, `packages/figma-plugin/build/ui.html`.

- [ ] **Step 3: Format, lint, commit**

  Run: `pnpm exec prettier --write packages/figma-plugin/src/ui.tsx`

  ```bash
  git add packages/figma-plugin/src/ui.tsx
  git commit -m "feat(figma-plugin): add the icon search UI"
  ```

---

### Task 5: Review-readiness checklist in the README

**Files:**

- Modify: `packages/figma-plugin/README.md`

**Interfaces:**

- Consumes: nothing new.
- Produces: nothing later tasks depend on; this is the last task in the plan.

- [ ] **Step 1: Add a Publish section**

  Append to `packages/figma-plugin/README.md`:

  ```md
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

  Figma's review guidelines are at
  https://help.figma.com/hc/en-us/articles/360039958914-Plugin-and-widget-review-guidelines.
  ```

- [ ] **Step 2: Verify the sections are present**

  Run: `grep -c '^## ' packages/figma-plugin/README.md`
  Expected: `4` (Develop, Test locally in Figma, Publish, and the top-level title does not count as a `##` heading).

- [ ] **Step 3: Format, commit**

  Run: `pnpm exec prettier --write packages/figma-plugin/README.md`

  ```bash
  git add packages/figma-plugin/README.md
  git commit -m "docs(figma-plugin): add the publish readiness checklist"
  ```

---

## Manual steps (yours, not part of the tasks above)

None of these can run inside this session: they need your Figma account, or a look at the plugin actually running in Figma.

1. Open Figma desktop, sign in.
2. Open the Figma menu, then Plugins, then Development, then "Import plugin from manifest...", and select `packages/figma-plugin/manifest.json` (built by Task 4). The placeholder `id` in `package.json` is fine for this step.
3. Run the plugin, search for an icon, click one, confirm it lands on the canvas at the center of your current view.
4. Report back what happened, ideally with a screenshot, so any bug gets fixed before going further.
5. When you are ready to publish: from Figma's plugin management page, start the publish flow for this plugin. Figma will assign the real plugin id at that point. Copy it into `figma-plugin.id` in `package.json`, rebuild, and re-test.
6. Prepare the listing assets Figma asks for (icon, cover image); ask if you want help with the copy.
7. Submit for review and relay Figma's response.
