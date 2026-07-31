# Contributing

This document is the reference for every contribution, human or automated.
Nothing here is a case by case judgement call. What is written applies.

## Layout

```
.                        repository root, ~/Futur/sketchyicons/lib
  packages/
    data/                  @sketchyicons/data          geometry, no framework
    static/                @sketchyicons/static        raw SVG files and sprite
    react/                 @sketchyicons/react
    react-native/          @sketchyicons/react-native
    vue/                   @sketchyicons/vue
    svelte/                @sketchyicons/svelte
    angular/               @sketchyicons/angular
    solid/                 @sketchyicons/solid
    preact/                @sketchyicons/preact
    vanilla/               sketchyicons                DOM, no framework
  tools/
    roughen-icons.mjs      the generator
    build-preview.mjs      the contact sheet
  .changeset/
  .github/workflows/
  docs/
  CONTRIBUTING.md
  README.md
  LICENSE
  NOTICE
```

The unscoped `sketchyicons` package exists for discoverability on npm and serves
the plain DOM target. Everything else lives under the `@sketchyicons` scope.

## What is committed and what is not

Committed:

- `packages/data/icons/*.json`, the generated geometry. This is the source of
  truth for every other package, and its diff is readable: bumping Lucide shows
  exactly which strokes moved.

Not committed:

- per framework components, generated at build time from `data`
- any `dist` directory

A generated file that is committed eventually drifts from its generator. The
exception above is deliberate, because a geometry diff is the only way to review
an upstream bump.

## Commits

[Conventional Commits](https://www.conventionalcommits.org) 1.0.0, with no local
variation.

```
<type>(<scope>): <subject>

<optional body>

<optional footer>
```

Allowed types, and nothing else:

| Type       | Use                                                 |
| ---------- | --------------------------------------------------- |
| `feat`     | a new capability for someone using the library      |
| `fix`      | a behaviour correction                              |
| `perf`     | a measured improvement, with the number in the body |
| `refactor` | no behaviour change                                 |
| `docs`     | documentation only                                  |
| `test`     | tests only                                          |
| `build`    | generator, bundling, dependencies                   |
| `ci`       | workflows                                           |
| `chore`    | everything else, never application code             |
| `revert`   | a reversal, with the SHA in the body                |

The scope is a package name without the npm scope prefix (`react`,
`react-native`, `data`, `static`), or `repo` for repository wide changes.

The subject is in the imperative mood, lower case, no trailing period, 72
characters at most.

```
feat(react): expose native svg props on every icon
fix(data): clamp drift to the length of the segment
build(repo): generate targets from data instead of from lucide
```

Rejected:

```
Added new icons                        no type, past tense, capitalised
feat: various improvements             says nothing
fix(react): fixed the bug              emoji, past tense, vague
feat(react): add icons - and types     em dash
```

A change that breaks the public API carries `!` after the scope and a
`BREAKING CHANGE:` footer stating the migration in one sentence.

```
feat(react)!: rename the strokeWidth prop to weight

BREAKING CHANGE: replace strokeWidth with weight at every call site.
```

### No tool attribution, ever

Commit messages carry no attribution to any tool or assistant. This applies to
every commit without exception, including the first one, and to merge commits,
amends and rebases.

The only allowed footers are `BREAKING CHANGE:`, `Refs:`, `Closes:` and
`Co-authored-by:` naming a **human** contributor.

Never written:

```
Co-authored-by: Claude <noreply@anthropic.com>
Co-Authored-By: Claude Code <...>
Generated with Claude Code
Assisted by an AI agent
```

The same applies to pull request descriptions, changesets, changelogs and code
comments. If a global git config or a tool default adds such a trailer, remove
it before committing and fix the setting.

## Writing style

Applies to commits, changesets, READMEs, pull request descriptions and code
comments.

Not allowed:

- the em dash and the en dash. A colon, a comma or a full stop does the job.
- emoji, anywhere, including section headings
- marketing vocabulary: `blazing fast`, `seamless`, `robust`, `comprehensive`,
  `powerful`, `elegant`, `simply`, `just`
- `leverage`, `utilize`, `delve`, `craft` used as verbs
- three item lists whose third item says nothing
- future tense for behaviour the code already has

Expected:

- active voice
- sentences that fit on one line where possible
- a number instead of an adjective: `cuts 41 kB from the bundle`, not
  `greatly reduces the bundle`
- the reason rather than the action, when the action is already visible in the
  diff

## Versioning

[Semantic Versioning](https://semver.org) 2.0.0, driven by
[Changesets](https://github.com/changesets/changesets).

Every package carries the same version number and they are released together.
This is the `fixed` group in `.changeset/config.json`, and it is deliberate: all
six packages draw the same icons from the same geometry, so two of them at the
same number are the same drawings. Under independent versions a reader had no way
to tell that `@sketchyicons/react` 0.1.1 and `@sketchyicons/vue` 0.2.0 carried an
identical catalogue.

The cost is that a package takes a version bump for a change it did not receive.
That is the trade, and for a set that ships one catalogue through several
renderers it falls the right way.

For an icon library, semver reads as follows:

| Change                                    | Level                                                  |
| ----------------------------------------- | ------------------------------------------------------ |
| new icons added                           | `minor`                                                |
| new optional prop                         | `minor`                                                |
| an icon removed or renamed                | `major`                                                |
| a prop removed or renamed                 | `major`                                                |
| the rendering of an existing icon changes | `minor`, and the changeset body shows before and after |
| an unreadable stroke fixed                | `patch`                                                |
| upstream Lucide geometry bumped           | `minor`, never `patch`                                 |

That last row is a rule, not a preference. Someone taking a patch upgrade does
not expect their icons to change shape, so an upstream bump is always at least
`minor`.

Any change a consumer can see requires a changeset in the same pull request.
Run `pnpm changeset` and write the summary in the style above.

## Tags

Created by Changesets, never by hand. The format is the Changesets default for a
multi package repository:

```
@sketchyicons/react@1.4.0
@sketchyicons/data@1.4.0
sketchyicons@1.4.0
```

No repository wide tag. No bare `v1.4.0`, which would be ambiguous across nine
packages.

## Release flow

1. One pull request per change, carrying its changeset.
2. CI checks every pull request: build, tests, `publint`,
   `@arethetypeswrong/cli`, bundle size, and the presence of a changeset when
   files under `packages/` changed.
3. Merging to `main` makes Changesets open a `Version Packages` pull request
   holding the version bumps and the changelogs.
4. Merging that pull request triggers publication.

## Publishing

- Published by CI only, never from a workstation. No npm token in the
  repository or in repository secrets.
- [Trusted publishing](https://docs.npmjs.com/trusted-publishers) over OIDC from
  GitHub Actions. npm then generates provenance attestations automatically, with
  no `--provenance` flag and no long lived credential.
- Scoped packages are private by default on npm, so every scoped `package.json`
  carries `"publishConfig": { "access": "public" }`. This is the classic
  oversight and it fails the first publish.
- `npm publish --dry-run` runs in CI and its contents are reviewed before the
  first real publish.

## Automated checks

None of these are optional and all of them run in CI.

| Check           | Tool                    | What it prevents                         |
| --------------- | ----------------------- | ---------------------------------------- |
| commit format   | `commitlint` and Husky  | an unreadable history                    |
| lint and format | ESLint, Prettier        | style debates in review                  |
| types           | `tsc --noEmit`          | an API that does not compile downstream  |
| packaging       | `publint`               | a broken `exports` map, a missing `main` |
| published types | `@arethetypeswrong/cli` | types the consumer cannot resolve        |
| determinism     | in house test           | two builds producing different drawings  |
| size            | `size-limit`            | one imported icon pulling in 1704        |
| rendering       | per target snapshots    | a stroke regression invisible in review  |

## Before opening a pull request

- [ ] commits follow the format and the style above
- [ ] a changeset is present if a package changed
- [ ] `pnpm build && pnpm test` passes
- [ ] `publint` and `attw` pass on the touched packages
- [ ] no generated file is committed, apart from `packages/data/icons`
- [ ] the README of the touched package is current

## Before a release

- [ ] the `Version Packages` pull request lists the right bump levels
- [ ] the changelogs read without knowing the code
- [ ] `npm publish --dry-run` contains no sources, tests or screenshots
- [ ] the contact sheet was reviewed if geometry changed
