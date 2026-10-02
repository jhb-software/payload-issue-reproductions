# conditional-tab-visibility-submitted-as-data

When a tab has `admin.condition`, the admin's save request contains a stray root-level key such as `"_index-2": {}`. The tab's visibility is stored in form state under its schema-path id (`_index-2.extra`) without `disableFormData`, so `reduceFieldsToValues` includes it and unflattens it into document data. The `pages` collection has a `beforeValidate` hook that throws on such keys, which makes the stray key visible. Because the id is a schema path, every row of a block also shares one tab visibility entry.

## Steps to reproduce

1. `pnpm install && cp .env.example .env`
2. `pnpm test:int`: both tests fail, showing `_index-2` (root tabs) and `_index-0` (tabs inside a block) in the data the admin form submits.
3. `pnpm dev` and log in at http://localhost:3000/admin as `dev@example.com` / `test` (seeded on first start).
4. Create a page, enter a title, and click **Save**.
5. **Expected**: the page is saved. **Actual**: "Something went wrong." The server logs `Unknown keys in data: _index-2`, and the request's `_payload` contains `"_index-2":{}`.

Block variant: add two **Section** rows to **Layout** and check **Show Extra** in the second row only. Both rows now show the **Extra** tab, and saving fails with `Unknown keys in data: _index-2, _index-0`.
