## Describe the Bug

In `packages/payload/src/hierarchy/hooks/collectionAfterRead.ts`, the draft flag passed to `computePaths` is derived from the document's own `_status`:

```ts
draft: doc._status === 'draft',
```

This is incorrect. `doc._status` reflects whether **this specific document** has unpublished changes — it does not reflect the **request's draft intent** (e.g. `draft: true` in the local API or `?draft=true` in the REST API / live preview).

**Broken scenario:**

1. Parent page: published slug `"about"`, draft slug `"about-us"` (draft saved but not published)
2. Child page: no pending draft changes → `_status: 'published'`
3. User opens child in live preview (`draft: true`)
4. `doc._status === 'draft'` is `false` for the child → `computePaths` receives `draft: false` → fetches the **published** parent → breadcrumb shows `"about/child"` instead of `"about-us/child"`

The user is in draft/preview mode and expects the entire path tree to reflect draft state, but `doc._status` only tells you about the document itself, not the request's intent.

**Fix:** Use the request's draft intent instead of `doc._status`:

```ts
draft: doc._status === 'draft' || req.query?.draft === 'true',
```

Or ideally expose `draft` as a proper hook argument so both REST and local API callers can set it cleanly — see related issue: https://github.com/payloadcms/payload/issues/16180

## Link to the code that reproduces this issue

https://github.com/jhb-software/payload-reproductions/tree/main/hierarchy-afterread-wrong-draft-context/

## Reproduction Steps

1. Clone the repo / open the folder `hierarchy-afterread-wrong-draft-context/`
2. `pnpm install`
3. `pnpm test:int` — the test fails, proving the bug

## Which area(s) are affected?

- plugin: hierarchy

## Environment Info

```
Binaries:
  Node: 24.16.0
  npm: 11.13.0
  Yarn: 1.22.22
  pnpm: 11.9.0
Relevant Packages:
  payload: 4.0.0-internal.e16cf59
  @payloadcms/db-sqlite: 4.0.0-internal.e16cf59
  @payloadcms/drizzle: 4.0.0-internal.e16cf59
  @payloadcms/translations: 4.0.0-internal.e16cf59
Operating System:
  Platform: linux
  Arch: x64
  Version: #134-Ubuntu SMP PREEMPT_DYNAMIC Fri Jun 26 18:43:11 UTC 2026
  Available memory (MB): 3916
  Available CPU cores: 1
```
