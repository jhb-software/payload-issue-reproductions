## Describe the Bug

When a tab has a function `admin.condition`, the admin's save request contains a stray root-level key such as `"_index-2": {}`. That key is not a configured field. Plain Payload drops it, so nothing visibly fails, but any `beforeValidate` hook or check that inspects `data` sees it.

**Root cause:**

1. [`sanitizeFields`](https://github.com/payloadcms/payload/blob/v3.90.2/packages/payload/src/fields/config/sanitize.ts) gives a tab with a function `admin.condition` and no `id` the id `tab.id = tabSchemaPath`. For a named tab `extra` in a tabs field that is the third root field, that is `_index-2.extra`.
2. [`addFieldStatePromise`](https://github.com/payloadcms/payload/blob/v3.90.2/packages/ui/src/forms/fieldSchemasToFormState/addFieldStatePromise.ts) stores the tab's visibility as `state[field.id] = { passesCondition }`, without `disableFormData: true`. The tabs field and unnamed containers get that flag; this entry does not.
3. On submit, [`Form`](https://github.com/payloadcms/payload/blob/v3.90.2/packages/ui/src/forms/Form/index.tsx) calls [`reduceFieldsToValues(fields, true)`](https://github.com/payloadcms/payload/blob/v3.90.2/packages/payload/src/utilities/reduceFieldsToValues.ts). It includes every entry without `disableFormData` and unflattens the dotted keys, so `_index-2.extra: undefined` becomes `{ "_index-2": { extra: undefined } }`, which serializes to `"_index-2": {}` in `_payload`.

**Blocks:** for a block defined in `config.blocks` (used via `blockReferences`), the block is sanitized on its own, so the tab id is relative to the block (`_index-0.extra`). It contains neither the blocks field's path nor the row index. The stray key `"_index-0": {}` then lands at the document root, not inside the row. For inline blocks the id is `layout.section._index-0.extra`, which also lacks the row index.

**Second effect:** since the id contains no row index, all rows of a block share one tab visibility entry. In the reproduction, checking "Show Extra" in the second row also shows the Extra tab in the first row.

Patching `addFieldStatePromise` to `state[field.id] = { disableFormData: true, passesCondition }` makes both tests pass. Suggested fix: mark tab visibility entries `disableFormData: true`, or keep them out of form data entirely. Separately, build conditional tab ids from the row's data path so rows don't share a visibility entry.

## Link to the code that reproduces this issue

https://github.com/jhb-software/payload-issue-reproductions/tree/main/conditional-tab-visibility-submitted-as-data/

## Reproduction Steps

1. Clone this repo and open the `conditional-tab-visibility-submitted-as-data/` directory
2. `pnpm install && cp .env.example .env`
3. `pnpm test:int`: the test builds form state with `fieldSchemasToFormState` and reduces it with `reduceFieldsToValues(state, true)` like `Form` does on submit, and fails
4. `pnpm dev` and log in at http://localhost:3000/admin as `dev@example.com` / `test`
5. Create a page, enter a title and click **Save**. The `pages` collection has a `beforeValidate` hook that throws on `_index-*` keys
6. **Expected**: the page is saved and `data` holds only configured fields. **Actual**: "Something went wrong", the server logs `Unknown keys in data: _index-2`, and the request's `_payload` is `{"title":"Hello","layout":0,"_index-2":{}}`
7. Block variant: add two **Section** rows to **Layout** and check **Show Extra** in the second row only. Both rows show the **Extra** tab, and saving fails with `Unknown keys in data: _index-2, _index-0`

Test output:

```
FAIL  tests/int.spec.ts > conditional tab visibility in submitted data > does not submit a root-level tab visibility entry
AssertionError: expected [ '_index-2' ] to deeply equal []

FAIL  tests/int.spec.ts > conditional tab visibility in submitted data > does not submit a root-level entry for a conditional tab inside a block
AssertionError: expected [ '_index-2', '_index-0' ] to deeply equal []
```

Only the second row has "Show Extra" checked, but both rows show the Extra tab:

![Rows share the tab visibility entry](https://raw.githubusercontent.com/jhb-software/payload-issue-reproductions/main/conditional-tab-visibility-submitted-as-data/docs/rows-share-tab-visibility.png)

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
