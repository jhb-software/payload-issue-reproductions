# duplicate-upload-ignores-data-overrides

`payload.duplicate({ collection, id, data })` silently ignores `data` on upload collections — the duplicate keeps the source document's field values. Non-upload collections respect `data`.

Regression introduced in `payload@3.71.0` (d462f9bcf4 / #15089): `uploads/generateFileData.ts` returns the source document instead of the incoming data while duplicating, and `operations/create.ts` overwrites `data` with it.

## Steps to reproduce

```bash
pnpm install
pnpm test:int
```

`tests/int.spec.ts` creates a document with `owner: 'source-owner'` and duplicates it with `data: { owner: 'override-owner' }`, once on `posts` (non-upload, passes) and once on `media` (upload, **fails** with `owner: 'source-owner'`).

Verified: passes on 3.70.0, fails on 3.71.0 and 3.87.1.

See [ISSUE.md](./ISSUE.md).
