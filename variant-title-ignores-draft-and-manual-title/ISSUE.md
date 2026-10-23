## Describe the Bug

The ecommerce plugin generates variant titles as `<product title> — <option labels>` in the variants collection's [`beforeChange` hook](https://github.com/payloadcms/payload/blob/v3.92.0/packages/plugin-ecommerce/src/collections/variants/createVariantsCollection/hooks/beforeChange.ts#L11-L47). The resulting title is wrong or can't be changed in three ways:

1. **It uses the published product, not the latest draft.** The hook loads the product with `findByID` without `draft: true`. Products have autosave drafts, so after renaming a product in the admin panel (without publishing yet), new variants still get the old product name.
2. **It never updates when the product is renamed.** The title is only generated when the variant itself is saved, and the products collection has no hook that updates its variants. Renaming and publishing a product leaves every existing variant with the old name until each variant is re-saved.
3. **It always overwrites `title`.** The hook sets `data.title` on every save where `options` is set, which is every save, since `options` is required. A manually entered title is discarded on create and on update. The [field description](https://github.com/payloadcms/payload/blob/v3.92.0/packages/plugin-ecommerce/src/collections/variants/createVariantsCollection/index.ts#L48) says "This is populated by default", which suggests it can be overridden, but the field can't be edited at all.

Suggested fix: read the product with `draft: true`, only generate the title when it is empty (or when it still equals the previously generated title), and regenerate variant titles from a products `afterChange` hook when the product title changes.

This affects both v3 and v4: the same hook ships in `4.0.0-beta.4` and is on `main`, and neither has a products hook that updates variant titles.

## Link to the code that reproduces this issue

https://github.com/jhb-software/payload-issue-reproductions/tree/main/variant-title-ignores-draft-and-manual-title/

## Reproduction Steps

1. Clone this repo and open the `variant-title-ignores-draft-and-manual-title/` directory
2. `pnpm install`
3. `pnpm test:int`: all four tests fail. Each creates a published product "Shirt" with a "Size" variant type and a variant with the option "Small".

```
× uses the latest draft of the product
    Expected: "T-Shirt — Small"
    Received: "Shirt — Small"
× updates the variant title when the product is renamed
    Expected: "T-Shirt — Small"
    Received: "Shirt — Small"
× keeps a manually entered title on create
    Expected: "Custom title"
    Received: "Shirt — Small"
× keeps a manually edited title on update
    Expected: "Edited title"
    Received: "Shirt — Small"
```

## Which area(s) are affected?

plugin: ecommerce

## Environment Info

```
Relevant Packages:
  payload: 3.92.0
  @payloadcms/plugin-ecommerce: 3.92.0
  @payloadcms/db-sqlite: 3.92.0
Node: 22.23.3, pnpm: 11.5.1, darwin arm64
```
