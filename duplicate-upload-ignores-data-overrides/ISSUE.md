## Describe the Bug

`payload.duplicate()` silently discards the caller's `data` overrides on upload collections. The operation reports success, but the created document keeps every field value of the source document.

On non-upload collections `data` is respected, so the same call behaves differently depending on whether the collection has `upload` configured.

This is a regression: the test in this reproduction passes on `payload@3.70.0` and fails from `payload@3.71.0` onwards (verified on 3.70.0 ✅, 3.71.0 ❌, 3.87.1 ❌).

**Cause**

`uploads/generateFileData.ts` builds its return value from the *source document* instead of the incoming data when duplicating:

```ts
const incomingFileData: Document = isDuplicating ? originalDoc : data // line 113
// ...
let newData = incomingFileData as T // line 175
```

`collections/operations/create.ts` then overwrites `data` wholesale with that value:

```ts
const { data: newFileData, files: filesToUpload } = await generateFileData({
  // ...
  isDuplicating: Boolean(duplicateFromID),
})
data = newFileData // line 176
```

Line 175 was changed from `let newData = data` to `let newData = incomingFileData as T` in d462f9bcf4 ("fix: full image urls stored in DB", #15089), first released in v3.71.0. Since `incomingFileData` is `originalDoc` while duplicating, the overrides never survive.

Note that the early return at line 160 (`return { data: incomingFileData, files: [] }`) drops the overrides too, so simply reverting line 175 may not be the complete fix.

**Impact**

The failure is silent, which makes it easy to miss. We hit this duplicating a tenant in a multi-tenant setup: the media copies were created with the *source* tenant's `tenant` field and the source's un-remapped relationship ids. Payload's filename dedupe renamed the file past our `(tenant, filename)` unique index, so nothing errored — the duplication reported success while the new tenant's documents pointed at the source tenant's media.

## Link to the code that reproduces this issue

https://github.com/jhb-software/payload-issue-reproductions/tree/main/duplicate-upload-ignores-data-overrides/

## Reproduction Steps

1. Clone this repo / open the `duplicate-upload-ignores-data-overrides` folder
2. `pnpm install`
3. `pnpm test:int`

Two tests run:

- `respects data overrides on a NON-upload collection (control)` — passes
- `respects data overrides on an UPLOAD collection` — **fails**

Both create a document with `owner: 'source-owner'` and duplicate it with `data: { owner: 'override-owner' }`. On the upload collection the duplicate comes back with `owner: 'source-owner'`:

```
AssertionError: expected 'source-owner' to be 'override-owner'

Expected: "override-owner"
Received: "source-owner"
```

## Which area(s) are affected?

- area: core

## Environment Info

```
Binaries:
  Node: 22.19.0
  npm: 10.9.3
  Yarn: N/A
  pnpm: 11.5.1
Relevant Packages:
  payload: 3.87.1
  next: 15.5.23
  @payloadcms/db-sqlite: 3.87.1
  @payloadcms/drizzle: 3.87.1
  @payloadcms/graphql: 3.87.1
  @payloadcms/next/utilities: 3.87.1
  @payloadcms/translations: 3.87.1
  @payloadcms/ui/shared: 3.87.1
  react: 19.2.8
  react-dom: 19.2.8
Operating System:
  Platform: darwin
  Arch: arm64
  Version: Darwin Kernel Version 24.6.0: Tue Apr 21 20:19:12 PDT 2026; root:xnu-11417.140.69.710.16~1/RELEASE_ARM64_T6041
  Available memory (MB): 24576
  Available CPU cores: 14
```
