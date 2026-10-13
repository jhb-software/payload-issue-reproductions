## Describe the Bug

When a single locale is published (a non-draft `update` with one `locale`), [`buildLocalizedPublishData`](https://github.com/payloadcms/payload/blob/v4.0.0-beta.0/packages/payload/src/versions/buildSingleLocalePublishData.ts#L54) calls [`mergeLocalizedData`](https://github.com/payloadcms/payload/blob/v4.0.0-beta.0/packages/payload/src/utilities/mergeLocalizedData.ts), which pairs array and block rows with the stored rows **by index** ([L132](https://github.com/payloadcms/payload/blob/v4.0.0-beta.0/packages/payload/src/utilities/mergeLocalizedData.ts#L132), [L184](https://github.com/payloadcms/payload/blob/v4.0.0-beta.0/packages/payload/src/utilities/mergeLocalizedData.ts#L184-L185)) instead of by `id`. Each merged row starts as a copy of that stored row ([L95](https://github.com/payloadcms/payload/blob/v4.0.0-beta.0/packages/payload/src/utilities/mergeLocalizedData.ts#L95)), so when the row at an index changes (reorder, insert, delete, block type change):

1. **Reordered array rows swap their other-locale values.** Swap two rows and publish `en`: each row now has the other row's `de` value. This silently corrupts a locale nobody edited, with the default storage.
2. **A new block inherits the fields of the block previously at its index.** Replacing an `alpha` block (`a`, `alphaLabel`) with a `beta` block (`b`) stores `{ blockType: 'beta', b, a, alphaLabel }`, persisted with `blocksAsJSON: true`.

v4 enables `localizeStatus` automatically, so every localized collection with drafts is affected. The merge runs [after all hooks](https://github.com/payloadcms/payload/blob/v4.0.0-beta.0/packages/payload/src/collections/operations/utilities/update.ts#L404), so it can't be worked around in a hook.

**Suggested fix:** match the stored row by `id` (for blocks also by `blockType`), falling back to `{}`, like [`getExistingRowDoc`](https://github.com/payloadcms/payload/blob/v4.0.0-beta.0/packages/payload/src/fields/hooks/beforeChange/getExistingRowDoc.ts) does. With that change both tests pass:

```ts
const existingItem = existingValue?.find((row) => row?.id && row.id === newItem.id) || {}
const blockData = existingValue?.find((row) => row?.id && row.id === newBlockData.id && row.blockType === newBlockData.blockType) || {}
```

The same bug exists in v3 (`3.90.2`): #18677

## Link to the code that reproduces this issue

https://github.com/jhb-software/payload-issue-reproductions/tree/main/single-locale-publish-leaks-stale-row-fields-v4/

## Reproduction Steps

1. Clone this repo and open the `single-locale-publish-leaks-stale-row-fields-v4/` directory
2. `pnpm install`
3. `pnpm test:int`: both tests fail

```
FAIL  keeps the other locale of an array row with that row when rows are reordered
- Expected: [["second", "Zweite"], ["first", "Erste"]]
+ Received: [["second", "Erste"], ["first", "Zweite"]]

FAIL  does not carry fields of the previous block at the same index into a new block
stored block: { blockType: 'beta', a: 'from alpha', alphaLabel: { en: 'alpha label' }, id: '…', b: 'from beta' }
```

## Which area(s) are affected?

area: core

## Environment Info

```
Relevant Packages:
  payload: 4.0.0-beta.0
  @payloadcms/db-sqlite: 4.0.0-beta.0
Node: 22.19.0, pnpm: 11.5.1, darwin arm64
```
