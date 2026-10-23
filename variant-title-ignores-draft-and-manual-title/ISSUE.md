## Describe the Bug

The ecommerce plugin generates variant titles as `<product title> — <option labels>` in the variants collection's [`beforeChange` hook](https://github.com/payloadcms/payload/blob/v3.92.0/packages/plugin-ecommerce/src/collections/variants/createVariantsCollection/hooks/beforeChange.ts#L11-L47). The title is used as the variant's `useAsTitle`, so it is what editors see in the admin panel, and it goes stale or wrong in three ways:

1. **It uses the published product, not the latest draft.** The hook loads the product with `findByID` without `draft: true`. Products have autosave drafts, so after a product is renamed (or duplicated as "… (copy)" and renamed) without publishing, new variants still get the old product name.
2. **It is not updated when the product is renamed.** The title is only generated when the variant itself is saved, and the products collection has no hook that updates its variants. Renaming a product leaves all its existing variants with the old name until each one is re-saved.
3. **Edits to the title are silently discarded.** The hook overwrites `title` on every save (`options` is required, so it is always set), but the field is editable in the admin panel and its [description](https://github.com/payloadcms/payload/blob/v3.92.0/packages/plugin-ecommerce/src/collections/variants/createVariantsCollection/index.ts#L48) ("This is populated by default") suggests the generated value is only a default that can be overridden.

Since the title is always derived, it could read the product with `draft: true`, be regenerated from a products `afterChange` hook when the product title changes, and be `readOnly` with a description that says it is generated.

This affects both v3 and v4: the same hook ships in `4.0.0-beta.4` and is on `main`, and neither has a products hook that updates variant titles.

## Link to the code that reproduces this issue

https://github.com/jhb-software/payload-issue-reproductions/tree/main/variant-title-ignores-draft-and-manual-title/

## Reproduction Steps

1. Clone this repo and open the `variant-title-ignores-draft-and-manual-title/` directory
2. `pnpm install`
3. `pnpm test:int`: all three tests fail. Each creates a published product "Shirt" with a "Size" variant type and a variant with the option "Small".

```
× uses the latest draft of the product
    Expected: "T-Shirt — Small"
    Received: "Shirt — Small"
× updates the variant title when the product is renamed
    Expected: "T-Shirt — Small"
    Received: "Shirt — Small"
× marks the always-generated title field as read-only
    (updating the title to "Edited title" returns "Shirt — Small")
    Expected: true
    Received: undefined
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
