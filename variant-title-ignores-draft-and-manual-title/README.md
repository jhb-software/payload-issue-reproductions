# variant-title-ignores-draft-and-manual-title

Reproduction for a Payload 3 bug in `@payloadcms/plugin-ecommerce`: the variants collection's `beforeChange` hook builds `title` as `<product title> — <option labels>`, and that title is wrong or stuck in three ways:

1. It reads the **published** product, not the latest draft, so a product renamed in a draft (products have autosave drafts) produces variants titled with the old name.
2. It only runs when the variant is saved, so renaming and publishing the product leaves all existing variant titles stale.
3. It overwrites `title` on every save that has `options`, so a title entered by hand (on create or on update) is always replaced, although the field description says it is only "populated by default".

## Steps

```bash
pnpm install
pnpm test:int
```

All four tests fail, one per behaviour (3. has a create and an update case).
