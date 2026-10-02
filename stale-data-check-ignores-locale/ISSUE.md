## Describe the Bug

When a collection uses drafts without autosave and `versions.drafts.localizeStatus` (with `experimental.localizeStatus: true`), the first edit of a document in a non-default locale opens the "Document modified – This document was recently updated by another user. Your view is out of date." modal, although nobody else changed the document. "Reload document" does not help: the next first edit fails the check again.

The modal appears whenever the edited locale has a draft that is newer than the default locale's state. Editing the same document in the default locale works fine.

**Root cause:** the edit view and the stale data check read the document in different locales.

- On page load, [`getDocumentData`](https://github.com/payloadcms/payload/blob/v3.90.2/packages/next/src/views/Document/getDocumentData.ts) reads the document with `draft: true, locale: locale?.code` and stores its `updatedAt` as `originalUpdatedAt`.
- On the first form state request, [`handleStaleDataCheck`](https://github.com/payloadcms/payload/blob/v3.90.2/packages/ui/src/utilities/handleStaleDataCheck.ts) calls `req.payload.findByID({ draft: true, ... })` without passing `locale` (or `req`), so it falls back to the default locale.
- With `localizeStatus`, [`replaceWithDraftIfAvailable`](https://github.com/payloadcms/payload/blob/v3.90.2/packages/payload/src/versions/drafts/replaceWithDraftIfAvailable.ts) filters versions by `version._status.<locale> = 'draft'`. For the edited locale it returns the newer draft version. For the default locale, which is published, it finds no draft and returns the main document with an older `updatedAt`.

The timestamps differ, so `isStale` is `true`. Passing `locale: req.locale` (or `req`) to the `findByID` / `findGlobal` calls in `handleStaleDataCheck` should fix it.

## Link to the code that reproduces this issue

https://github.com/jhb-software/payload-issue-reproductions/tree/main/stale-data-check-ignores-locale/

## Reproduction Steps

1. Clone this repo and open the `stale-data-check-ignores-locale/` directory
2. `pnpm install && cp .env.example .env`
3. `pnpm test:int`: the test runs the same two reads as the edit view and the stale data check, and fails
4. `pnpm dev` and log in at http://localhost:3000/admin as `dev@example.com` / `test`
5. Open http://localhost:3000/admin/collections/pages/1?locale=de (the seeded page is published in `en` and `de`, with a newer draft in `de`) and change the **Style** select
6. **Expected**: no modal. **Actual**: the "Document modified" modal opens. The same edit with `?locale=en` does not open it.

Test output:

```
FAIL  tests/int.spec.ts > stale data check with localizeStatus > reads the same updatedAt as the edit view for a non-default locale
AssertionError: expected '2026-10-02T07:23:39.066Z' to be '2026-10-02T07:23:39.077Z' // Object.is equality

Expected: "2026-10-02T07:23:39.077Z"
Received: "2026-10-02T07:23:39.066Z"
```

![Document modified modal](https://raw.githubusercontent.com/jhb-software/payload-issue-reproductions/main/stale-data-check-ignores-locale/docs/document-modified-modal.png)

## Which area(s) are affected?

area: ui

## Environment Info

```
Binaries:
  Node: 22.19.0
  npm: 10.9.3
  Yarn: N/A
  pnpm: 11.5.1
Relevant Packages:
  payload: 3.90.2
  next: 16.3.8
  @payloadcms/db-sqlite: 3.90.2
  @payloadcms/drizzle: 3.90.2
  @payloadcms/graphql: 3.90.2
  @payloadcms/next/utilities: 3.90.2
  @payloadcms/translations: 3.90.2
  @payloadcms/ui/shared: 3.90.2
  react: 19.3.0
  react-dom: 19.3.0
Operating System:
  Platform: darwin
  Arch: arm64
```
