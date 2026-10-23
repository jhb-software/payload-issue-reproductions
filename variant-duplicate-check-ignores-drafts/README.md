# variant-duplicate-check-ignores-drafts

Reproduction for a Payload 3 bug in `@payloadcms/plugin-ecommerce`: the variants `options` validation (`validateOptions`) checks for a duplicate options combination against the **published** options of the product's other variants, not their latest drafts. When another variant's options were changed in a draft only, publishing a variant with its old combination is rejected as a duplicate.

The test publishes variant A as "Small", changes A to "Large" in a draft, then creates variant B as a draft with "Small" and publishes it. Publishing B fails with `ecommerce:variantOptionsAlreadyExists`. That message is also untranslated, which is a separate bug, see [`../variant-options-validation-untranslated-keys`](../variant-options-validation-untranslated-keys/).

## Steps

```bash
pnpm install
pnpm test:int
```

The test fails. It passes when `validateOptions` loads the product with `draft: true` and excludes the variant being validated by ID after the query (with `draft: true`, the join's `id: { not_equals }` filter no longer excludes it on SQLite).
