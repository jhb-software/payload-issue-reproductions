## Describe the Bug

In v4, publishing a single locale (a non-draft `update` with one `locale`) builds the main document with [`buildLocalizedPublishData`](https://github.com/payloadcms/payload/blob/v4.0.0-beta.0/packages/payload/src/versions/buildSingleLocalePublishData.ts#L54), which merges the saved data onto the stored main document with [`mergeLocalizedData`](https://github.com/payloadcms/payload/blob/v4.0.0-beta.0/packages/payload/src/utilities/mergeLocalizedData.ts). That function pairs block and array rows with the stored rows **by index**, not by `id`:

- arrays: [`const existingItem = existingValue?.[index] || {}`](https://github.com/payloadcms/payload/blob/v4.0.0-beta.0/packages/payload/src/utilities/mergeLocalizedData.ts#L132)
- blocks: [`existingValue[index]`](https://github.com/payloadcms/payload/blob/v4.0.0-beta.0/packages/payload/src/utilities/mergeLocalizedData.ts#L184-L185)

and each merged row starts as a copy of that stored row ([`const result = { ...docWithLocales }`](https://github.com/payloadcms/payload/blob/v4.0.0-beta.0/packages/payload/src/utilities/mergeLocalizedData.ts#L95)). So whenever the row at an index changes (block type change, reorder, insert, delete), the new row is merged with the wrong stored row:

1. **A new block inherits the fields of the block that was at its index before.** Replacing an `alpha` block (`a`, localized `alphaLabel`) with a `beta` block (`b`) and publishing stores `{ blockType: 'beta', b, a, alphaLabel }`. With `blocksAsJSON: true` the stale keys are persisted on the main document.
2. **Reordering array rows moves the other locales' values onto the wrong rows.** Swap two array rows and publish `en` only: the `de` values of a localized field stay at their old index, so each row now shows the other row's `de` value. This happens with the default relational storage as well, and silently corrupts content in locales that were not touched.

v4 enables `localizeStatus` automatically for every localized collection with drafts, so every such collection is affected, with no config change needed. The merge is [called from the update operation](https://github.com/payloadcms/payload/blob/v4.0.0-beta.0/packages/payload/src/collections/operations/utilities/update.ts#L404) after all hooks have run, so no collection hook can correct it. Publishing all locales does not go through this merge.

**Suggested fix:** pair the stored row by `id` (and, for blocks, also require the same `blockType`), falling back to `{}`, the way [`getExistingRowDoc`](https://github.com/payloadcms/payload/blob/v4.0.0-beta.0/packages/payload/src/fields/hooks/beforeChange/getExistingRowDoc.ts) already does for `beforeChange`:

```ts
// arrays
const existingItem =
  (Array.isArray(existingValue) && existingValue.find((row) => row?.id && row.id === newItem?.id)) || {}

// blocks
const blockData =
  (Array.isArray(existingValue) &&
    existingValue.find((row) => row?.id && row.id === newBlockData.id && row.blockType === newBlockData.blockType)) ||
  {}
```

With this change applied to `dist/utilities/mergeLocalizedData.js`, both tests in the reproduction pass.

The same bug exists in v3 (`3.90.2`), reported separately.

## Link to the code that reproduces this issue

https://github.com/jhb-software/payload-issue-reproductions/tree/main/single-locale-publish-leaks-stale-row-fields-v4/

## Reproduction Steps

1. Clone this repo and open the `single-locale-publish-leaks-stale-row-fields-v4/` directory
2. `pnpm install`
3. `pnpm test:int`: both tests fail, proving the bug

The config has `localization` (`en`, `de`), SQLite with `blocksAsJSON: true`, and one `pages` collection with drafts, a non-localized `content` blocks field (`alpha`: `a` + localized `alphaLabel`; `beta`: `b`), and a non-localized `items` array (`key` + localized `label`).

Test output:

```
FAIL  tests/int.spec.ts > single-locale publish (v4) > does not carry fields of the previous block at the same index into a new block
AssertionError: expected { blockType: 'beta', …(4) } to not have property "a"

stored block: {
  blockType: 'beta',
  a: 'from alpha',
  alphaLabel: { en: 'alpha label' },
  id: '6ace22487e54ce2e3304d9e3',
  b: 'from beta'
}

FAIL  tests/int.spec.ts > single-locale publish (v4) > keeps the other locale of an array row with that row when rows are reordered
AssertionError: expected [ [ 'second', 'Erste' ], …(1) ] to deeply equal [ [ 'second', 'Zweite' ], …(1) ]

  [
    [
      "second",
-     "Zweite",
+     "Erste",
    ],
    [
      "first",
-     "Erste",
+     "Zweite",
    ],
  ]
```

## Which area(s) are affected?

area: core

## Environment Info

```
Binaries:
  Node: 22.19.0
  npm: 10.9.3
  Yarn: N/A
  pnpm: 11.5.1
Relevant Packages:
  payload: 4.0.0-beta.0
  @payloadcms/db-sqlite: 4.0.0-beta.0
  @payloadcms/drizzle: 4.0.0-beta.0
  @payloadcms/translations: 4.0.0-beta.0
Operating System:
  Platform: darwin
  Arch: arm64
```
