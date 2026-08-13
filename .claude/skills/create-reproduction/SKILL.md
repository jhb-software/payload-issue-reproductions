---
name: create-reproduction
description: Create a minimal reproduction of a Payload CMS v3 bug in this repo, prove it (with a failing integration test, or with the admin panel for UI bugs), and prepare a GitHub issue for the payloadcms/payload repository. Use when the user reports a Payload CMS bug and wants a reproduction built and an issue filed.
user_invocable: true
---

# Create a Payload CMS Bug Reproduction

Build a minimal reproduction of a Payload CMS v3 bug as a folder in this repo, prove that it
reproduces, and prepare the GitHub issue for Jens to approve.

All work happens in `/Users/jhb/dev/oss/payload-issue-reproductions`. Never create a reproduction
anywhere else, and never create a separate GitHub repo for one — every reproduction is a folder in
this repo and is linked from the Payload issue by its folder URL.

The user provides a description of the bug. That is the input.

## Never leak details of the project the bug was found in

This repo is public, and the issues filed from it are public. The bugs almost always surface in
private client work. Nothing from that codebase may appear in the reproduction, the `ISSUE.md`, the
commit messages, or the GitHub issue.

Rebuild the bug from generic primitives — `pages`, `posts`, `media`, `users`, `tenants` — never by
copying and trimming the original code. In particular, never carry over:

- client, project, or product names, in any casing, including in the folder name and branch names
- domain-specific collection, field, global, block, or slug names — rename them to generic ones
- real content, seed data, tenant names, user emails, or URLs — use `example.com` and dummy data
- credentials, API keys, or anything from a private `.env`
- stack traces, logs, or `payload info` output containing private package names or filesystem paths
- screenshots of the private admin panel — capture them from *this* reproduction's admin panel only

Before Phase 6, grep the folder and the `ISSUE.md` for the client/project name and check every
screenshot for branding, real data, or a give-away URL in the address bar. If the bug genuinely
cannot be shown without something private, say so and stop — do not file a redacted version and hope.

## Phase 0: Choose the flavour

Two shapes exist. Pick deliberately, and tell the user which one you picked and why.

**Headless** (default) — no Next.js app, no `src/app/`, config + collections + a vitest integration
test. Use when the bug lives in the Local API, hooks, access control, the database adapter, GraphQL,
the REST API, or config resolution — anything you can trigger from `payload.<operation>()`.

**Admin app** — the full `create-payload-app` blank template with the admin panel running. Use when
the bug only exists in the browser: admin UI components, field rendering and conditions, the list
view, lexical editor behaviour, drawers and pickers, client-side validation, form state,
`admin.components` overrides, live preview. If reproducing it means "click this and watch what
happens", you need the app.

Bias towards headless — it is faster to run, faster to review, and a maintainer can verify it in one
command. But do not force a UI bug into a headless test. A reproduction that doesn't reproduce the
actual bug is worse than a larger one that does. When in doubt, ask the user.

Existing examples of each: the folders in this repo are all headless. The archived
`/Users/jhb/dev/oss/payload-reproductions` holds ~37 app-flavoured reproductions (MongoDB-based, so
do not copy their DB setup) — useful as a reference for `src/app/` layout, seed scripts, and how
those issues were written up.

## Phase 1: Scaffold the folder

Pick a short kebab-case name describing the *symptom*, not the fix — e.g.
`duplicate-upload-ignores-data-overrides`, `lexical-link-picker-ignores-tenant-filter`. That is the
folder name and the `package.json` name.

### Headless

Copy the closest existing reproduction folder in this repo and strip it down. Read its files first —
they are the reference for the expected shape.

```
<name>/
  .env.example          DATABASE_URI=file:./repro.db + PAYLOAD_SECRET
  .gitignore            node_modules/ .next/ dist/ repro.db *.db media/
  ISSUE.md              the issue body, in the format below
  README.md             one-paragraph description + steps to reproduce
  package.json          name = folder name, scripts: dev, build, generate:types, test:int
  src/payload.config.ts minimal config, @payloadcms/db-sqlite
  src/collections/      only the collections the bug needs
  tests/int.spec.ts     the test that proves the bug
  tests/setup.ts        getPayload in beforeAll, db.destroy in afterAll
  tsconfig.json
  vitest.config.mts
```

### Admin app

From the repo root:

```
pnpx create-payload-app@latest <name> -t blank --db sqlite --db-accept-recommended
```

Then make it fit this repo:

1. Remove the nested `.git/` the scaffolder creates — otherwise you get a repo inside the repo.
2. Delete what the bug doesn't need: `Dockerfile`, `docker-compose.yml`, `.vscode/`, `.yarnrc`,
   eslint/prettier config. Keep `src/app/(payload)/` — that is the admin panel.
3. Set `package.json` `name` to the folder name.
4. Write `.env.example` with `DATABASE_URI=file:./repro.db` and a dummy `PAYLOAD_SECRET`, and a
   matching `.env` locally.
5. Add the same `.gitignore` as the headless folders, plus `.next/`.
6. If the reproduction needs data to exist before you can see the bug, add `src/seed.ts` and wire it
   into `payload.config.ts` via `onInit` so it runs on first server start. Document the login
   credentials it creates in `README.md`.
7. If you need the Media collection, make its `alt` field optional — the template marks it required,
   which breaks `duplicate()` and any operation that doesn't pass it. (Learned the hard way in the
   old repo.)

Both flavours: SQLite (`@payloadcms/db-sqlite`), `latest` for all `payload` / `@payloadcms/*`
packages, TypeScript everywhere.

## Phase 2: Implement the reproduction

1. Add only what the bug needs. The reproduction should be readable in one sitting.
2. Comment the code where expected and actual behaviour diverge.
3. Prefer a failing integration test as the proof — see Phase 3 for when that doesn't apply.

## Phase 3: Prove it reproduces

Never push or prepare an issue for a bug you have not seen with your own eyes. If it does **not**
reproduce, stop here and tell the user.

### Preferred: a failing integration test

Write `tests/int.spec.ts` asserting the **correct** behaviour, so the failing assertion is the proof.
Do not write a test that asserts the buggy behaviour and passes — that inverts on the day it's fixed
and tells a maintainer nothing.

```
pnpm install
pnpm test:int
```

Confirm it fails **for the reason the bug describes** — not because of a typo, a missing env var, or
a broken config. Read the failure output and capture it; it goes in `ISSUE.md`.

This applies to app-flavoured reproductions too whenever the bug has a server-side assertion — e.g.
the UI misbehaves *because* the underlying operation returns the wrong data. Prove the part you can.

### When the bug is browser-only

A failing test is not required. Some bugs only exist in rendered admin UI and cannot be asserted from
the Local API. For those:

1. `pnpm dev` (run in background) and open the admin panel.
2. Drive it with the `agent-browser` CLI and confirm the misbehaviour yourself.
3. Capture evidence: a screenshot, the browser console error, or the network response.
4. Write the click-by-click steps in `README.md` and `ISSUE.md`, precise enough that a maintainer
   reproduces it on the first try — which collection, which field, which sequence of clicks, what
   you expected, what happened.
5. Stop the dev server.

Do not add Playwright. The evidence plus exact steps is what the issue needs.

## Phase 4: Write ISSUE.md

No H1 at the top — GitHub takes the title from a separate field. Start directly with
`## Describe the Bug`.

```markdown
## Describe the Bug

[Clear description. Include root-cause analysis and links to the relevant Payload source
files here — this is the only section where secondary links belong.]

## Link to the code that reproduces this issue

https://github.com/jhb-software/payload-issue-reproductions/tree/main/<folder>/

## Reproduction Steps

[see below]

## Which area(s) are affected?

plugin: richtext-lexical

## Environment Info

[output of `pnpm payload info`]
```

Reproduction steps, headless:

```
1. Clone this repo and open the `<folder>/` directory
2. `pnpm install`
3. `pnpm test:int` — the test fails, proving the bug
```

Reproduction steps, admin app:

```
1. Clone this repo and open the `<folder>/` directory
2. `pnpm install && cp .env.example .env`
3. `pnpm dev` and log in at http://localhost:3000/admin as [seeded credentials]
4. [exact clicks]
5. **Expected**: [...]  **Actual**: [...]
```

Either way, include the captured evidence — test failure output, console error, or screenshot.

Run `pnpm payload info` in the folder for the environment section.

### Triage-bot rules — get these wrong and the issue is auto-flagged

Payload's `.github/workflows/triage.yml` parses the issue body by regex. It auto-applies
`validate-reproduction` and derives area labels from the headings.

- Use the heading `### Link to the code that reproduces this issue` **verbatim** in the filed issue.
- Between that heading and the next one, put **only the bare repo URL** — no bullets, no prose, no
  second link. The bot runs `URL.canParse()` on the whole captured block; anything else fails.
- The URL host must be `github.com` and must return HTTP `< 400` or `>= 500`. A 404 or a private
  repo gets the issue flagged `invalid-reproduction`. Verify before filing:
  `curl -sI -o /dev/null -w "%{http_code}\n" <url>` → must be `200`. The folder must be pushed
  first, or this 404s.
- Use the heading `### Which area(s) are affected?` exactly — **never append
  `(Select all that apply)`** or any other suffix. The regex is
  `### Which area\(s\) are affected\?(.*)### Environment Info` and the entire captured block becomes
  the label text, so a suffix creates a garbage label instead of the canonical one.
- Between that heading and `### Environment Info`, put **only canonical label names**, one per line
  (e.g. `plugin: ecommerce`) — no checkboxes, no bullets, no prose.

Canonical areas include: `area: core`, `area: ui`, `area: graphql`, `plugin: richtext-lexical`,
`plugin: cloud-storage`, `plugin: multi-tenant`, `plugin: ecommerce`.

Note the heading levels: `ISSUE.md` uses `##`, the filed issue body uses `###`.

## Phase 5: Push the folder

Commit and push to `main` (conventional commits, no description unless asked):

```
git add <folder> && git commit -m "feat: add <folder> reproduction"
```

The folder must be live on GitHub before the issue is filed, otherwise the reproduction link 404s
and the bot flags it.

## Phase 6: STOP — human review

**Every reproduction and every GitHub issue must be reviewed and approved by Jens before it is filed
publicly. Never open an issue autonomously.**

1. Show Jens the full `ISSUE.md`.
2. Check it against the Payload bug template: all five sections present (Describe the Bug, Link to
   the code that reproduces this issue, Reproduction Steps, Which area(s) are affected?,
   Environment Info), no H1, bare URL, clean area heading.
3. Wait for explicit approval.

## Phase 7: File the issue

Only after approval. Title format: `bug: [concise description]`, under 70 characters.

```
gh issue create --repo payloadcms/payload \
  --title "bug: [title]" \
  --body-file /tmp/issue-body.md
```

Write the body to a file first (headings promoted from `##` to `###`) rather than inlining it —
it avoids shell-quoting damage to the body, which the bot's regexes are sensitive to.

## Phase 8: Record it

1. Add a row to the root `README.md` table: folder link, issue link, status `filed`. Keep this table
   accurate — it is the index of the repo.
2. Commit that change.
3. Report back: folder name, issue URL, and one line on what was reproduced and how it is proven.

## Reference

- [Payload issue template](https://github.com/payloadcms/payload/blob/main/.github/ISSUE_TEMPLATE/1.bug_report_v3.yml)
- [Payload reproduction guide](https://github.com/payloadcms/payload/blob/main/.github/reproduction-guide.md)
