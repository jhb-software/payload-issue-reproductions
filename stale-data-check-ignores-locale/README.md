# stale-data-check-ignores-locale

With `experimental.localizeStatus` enabled on a drafts collection (no autosave), the first edit of a document in a non-default locale opens the "Document modified" modal, even though nobody else changed the document. The edit view loads the document in the edited locale, but the stale data check (`handleStaleDataCheck`) re-reads `updatedAt` without a locale. With `localizeStatus`, the default locale can resolve to a different version, so the two timestamps never match.

## Steps to reproduce

1. `pnpm install && cp .env.example .env`
2. `pnpm test:int`: the test fails, showing the two reads return different `updatedAt` values.
3. `pnpm dev` and log in at http://localhost:3000/admin as `dev@example.com` / `test` (seeded on first start).
4. Open http://localhost:3000/admin/collections/pages/1?locale=de and change the **Style** select.
5. **Expected**: no modal. **Actual**: "Document modified – This document was recently updated by another user."

The same edit with `?locale=en` does not show the modal.
