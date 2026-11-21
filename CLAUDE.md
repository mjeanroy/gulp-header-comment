# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`gulp-header-comment` is a Gulp plugin that prepends a templated header comment to files in a stream. The whole plugin lives in `src/index.js`; `dist/` is the Babel output that npm consumers load (`main: dist/index.js`).

## Commands

Package manager is pnpm (CI uses pnpm 10; `pnpm-workspace.yaml` sets supply-chain policies like `minimumReleaseAge`). All npm scripts delegate to Gulp tasks defined in `gulpfile.js`, with implementations in `scripts/<task>/index.js`.

- `pnpm test`: clean → lint → build → run all `test/**/*.spec.js` with Jasmine. Lint runs first, so any ESLint warning fails the test run.
- `pnpm run lint`: ESLint (airbnb-base) over root `*.js`, `src`, `test`, `scripts`. Warnings are treated as errors. Pass `--file <path>` (repeatable; file, directory or glob) to lint only those paths, e.g. `pnpm run lint --file src/index.js --file test/index.spec.js`. A `--file` that matches nothing is an error. Chained tasks (`build`, `test`, `release:*`) always lint the whole project and ignore `--file`.
- `pnpm run build`: clean, lint, then Babel `src/` → `dist/` (preset-env targeting Node 6).
- `pnpm run tdd`: build, then watch `src` (rebuild) and `test`/`dist` (rerun specs).
- `pnpm run test:unit`: runs only the Jasmine specs (no clean/lint/build). It accepts `--file <path>` (repeatable; absolute or relative to the repo root) and `--filter <regex>` (matched against the full spec name):
  - `pnpm run test:unit --file test/index.spec.js`
  - `pnpm run test:unit --file test/index.spec.js --filter "null file"`

Tests `require('../src/index')` directly, not `dist/`, so `test:unit` needs no build. `scripts/test/index.js` runs Jasmine through its programmatic API (not gulp-jasmine). The same flags also apply to the spec step of `pnpm test` and `tdd`.

`--file` / `--filter` are parsed once in `scripts/cli/index.js` (`readCliOptions`, using `node:util` `parseArgs`), which turns paths into repo-root-relative forward-slash form for both Jasmine and ESLint.

## Architecture

`src/index.js` exports a factory `gulpHeaderComment(options)` that returns a `through2` object stream. `options` is either a template string, or `{ file, encoding, cwd, separator }`. For each Vinyl file:

1. `read()` resolves the header template (the string itself, or the contents of `options.file`).
2. `generateHeader()` renders it with `_.template`, passing `{ _, moment, pkg, file }`. `pkg` is `package.json` from `cwd`, `file` comes from `createFileObject` (name, dir, path, relativePath, relativeDir). The `commenting` package then wraps it in the comment syntax for the file extension.
3. Buffer files go through `transform()`, which uses `MagicString` so a source map is generated. The map is applied with `vinyl-sourcemaps-apply` when `file.sourceMap` is set (gulp-sourcemaps). Stream files are either piped with a prepended chunk, or transformed chunk-by-chunk when the type may have a prolog.
4. **Prolog handling:** `prologCheckers` maps extensions (`html`/`htm` doctype, `xml`/`svg` `<?xml`, `js` shebang) to checks on the first line. If the first line is a prolog, the header goes *after* it rather than at the top. To support a new prolog type, add an entry there.

Errors are logged with `fancy-log` and passed to the callback as a `PluginError`.

## Tests

- `test/index.spec.js`: unit tests that build Vinyl files by hand (buffer, stream, null) and check the plugin's output.
- `test/it.spec.js`: integration tests that run real `gulp.src(...).pipe(headerComment(...))` pipelines (including gulp-sourcemaps) into a `tmp` directory.
- `test/fixtures/`: input files per type. `test/utils/` has EOL and line-joining helpers, since CI runs on Windows, Linux and macOS (Node 18–25).

## Compatibility constraints

- `src/` must stay CommonJS. `dist/` is compiled for very old Node (Babel targets Node 6), and the plugin still supports old Node versions that gulp supports. Runtime `dependencies` must stay CJS-compatible too.
- Two major upgrades are deliberately held back (see `.github/dependabot.yml`):
  - `magic-string`: its next major is ESM-only (effectively Node ≥ 22). It stays on 0.30.x while gulp still supports Node 10.
  - `eslint`: v9 needs the flat config, and the repo still uses the legacy `.eslintrc`. Don't migrate the config or bump these as a side task.
- `.eslintrc`: `import/no-extraneous-dependencies` allows devDependencies only in `scripts/`, `test/` and `gulpfile.js`. Anything `src/` imports must be in `dependencies`. `max-len` is 200.
- Dependencies are pinned to exact versions (`.npmrc`: `save-exact=true`). No lockfile is committed (`package-lock=false`). New releases must be a couple of days old before install (`.npmrc` `min-release-age`, `pnpm-workspace.yaml` `minimumReleaseAge`).
- Local Node version is in `.nvmrc` (20.x). Scripts use `node:`-prefixed imports and `util.parseArgs`, so the tooling needs Node ≥ 18.3, while `dist/` doesn't.

## Conventions

- `README.md` documents the public options and template variables (`pkg`, `moment`, `_`, `file.*`). Update it when they change.
- Every code example in `README.md` must actually work as written: valid syntax, correct `require`s (e.g. `path`, `gulp`), real option names and template variables, and output that matches what the plugin produces. Check any example you add or touch against the current `src/index.js`.

- Every source file starts with the MIT license header block. Keep it on new files.
- Commits follow Conventional Commits (`feat:`, `fix:`, `chore(deps):`, …), since `pnpm run changelog` generates `CHANGELOG.md` with conventional-changelog.
- Release tasks (`release:patch|minor|major`) force-add `dist/`, run `npm version`, then `git rm` `dist/` and commit "prepare next release". `dist/` is gitignored and only committed in release tags. Don't commit it otherwise.
