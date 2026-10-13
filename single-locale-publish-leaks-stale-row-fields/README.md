# single-locale-publish-leaks-stale-row-fields

Reproduction for a Payload 3 bug: when a single locale is published with `localizeStatus`, `mergeLocalizedData` pairs block and array rows with the stored rows **by index** instead of by `id`. When a row at an index changes (block type change, reorder, insert, delete), the new row inherits the stored row's fields:

- a block that replaces another block type keeps the old block's fields (visible with `blocksAsJSON: true`)
- reordering array rows moves the other locales' values onto the wrong rows

A v4 version of this reproduction lives in [`../single-locale-publish-leaks-stale-row-fields-v4`](../single-locale-publish-leaks-stale-row-fields-v4/).

## Steps

```bash
pnpm install
pnpm test:int
```

Both tests fail. They pass when `mergeLocalizedData` matches the stored row by `id` (and, for blocks, by `blockType`).
