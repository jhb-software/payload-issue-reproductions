# payload-reproductions

Public repo with minimal reproductions for Payload CMS GitHub issues.

One folder per issue. Each folder is linked from the corresponding Payload GitHub issue.

## How to create a reproduction

Payload's preferred format (from their ISSUE_GUIDE.md) uses files modeled after their `test/_community/` structure:

- `config.ts` — minimal Payload config, as lightweight as possible
- `int.spec.ts` _(optional)_ — vitest integration tests (`pnpm test:int _community`)
- `e2e.spec.ts` _(optional)_ — Playwright E2E tests
- `payload-types.ts` — generated types (`pnpm dev:generate-types _community`)
- `README.md` — describe the bug: expected vs actual, steps to reproduce, environment

**Goal: isolate the problem with minimal config. No full project copies.**

## Workflow

1. Create a folder: `<short-description-of-issue>/`
2. Add `README.md` + `config.ts` (+ optional spec files)
3. Push to this repo (`main`)
4. Open a Payload GitHub issue and link to the folder:
   `https://github.com/jhb-software/payload-reproductions/tree/main/<folder>/`

## Issues

| Folder | Payload Issue | Status |
|--------|--------------|--------|
| `lexical-list-node-missing-tag-listtype/` | TBD | in progress |
