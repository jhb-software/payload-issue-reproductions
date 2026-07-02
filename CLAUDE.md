# payload-reproductions

Public repo with minimal reproductions for Payload CMS GitHub issues.

One folder per issue. Each folder is linked from the corresponding Payload GitHub issue.

## How to create a reproduction

Payload's preferred format: use `pnpx create-payload-app@latest -t blank` as a base, push to a public repo, and link it in the issue.

- [Payload issue template](https://github.com/payloadcms/payload/blob/main/.github/ISSUE_TEMPLATE/1.bug_report_v3.yml)
- [Reproduction guide](https://github.com/payloadcms/payload/blob/main/.github/reproduction-guide.md)

Each reproduction folder must contain:
- `ISSUE.md` — filled out in the Payload issue template format (see below)
- `src/payload.config.ts` — minimal Payload config (based on blank template, SQLite)
- `src/collections/` — only the collections needed to reproduce the issue
- `tests/int.spec.ts` — vitest test that **fails** to prove the bug
- `tests/setup.ts` — test setup
- `vitest.config.mts`, `tsconfig.json`, `package.json`, `.env.example`
- `README.md` — short description + steps to reproduce

## ISSUE.md format

No H1 (`#`) at the top — GitHub uses the issue title field separately. Start directly with `## Describe the Bug`.

```markdown
## Describe the Bug

[Clear description of the bug]

## Link to the code that reproduces this issue

https://github.com/jhb-software/payload-reproductions/tree/main/<folder>/

## Reproduction Steps

1. Clone this repo / open the folder
2. `pnpm install`
3. `pnpm test:int` — the test fails, proving the bug

## Which area(s) are affected?

- plugin: richtext-lexical

## Environment Info

[output of `pnpm payload info`]
```

## Workflow

1. Create a folder: `<short-description>/`
2. Add all required files (see above), including `ISSUE.md`
3. Push to this repo (`main`)
4. **STOP — human review required before filing:** show Jens the `ISSUE.md` and confirm he approves it
   - Before approval: verify `ISSUE.md` matches the Payload issue template exactly (all 5 required fields: Describe the Bug, Link, Reproduction Steps, Area, Environment Info)
5. Open the Payload GitHub issue only after explicit approval
6. After the Payload issue is created: add the issue link to the root `README.md` table — keep it always up to date

> Every reproduction and every GitHub issue **must be reviewed and approved by Jens** before it is filed publicly. Never open an issue autonomously.

## Issues

| Folder | Payload Issue | Status |
|--------|--------------|--------|
| `lexical-list-node-missing-tag-listtype/` | TBD | ready to file |
