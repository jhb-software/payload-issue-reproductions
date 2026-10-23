## Describe the Bug

The ecommerce plugin validates that no two variants of a product use the same options combination. The check in [`validateOptions`](https://github.com/payloadcms/payload/blob/v3.92.0/packages/plugin-ecommerce/src/collections/variants/createVariantsCollection/hooks/validateOptions.ts#L25-L46) loads the product's `variants` join with `findByID` without `draft: true`, so it compares against the other variants' **published** options. Variants have drafts, and changes saved as a draft don't touch the published values.

So when a variant's options are corrected in a draft, its old combination still counts as taken. Creating variants, fixing their options as drafts, and then publishing them one by one fails with "This variant combo is already in use by another variant", although no variant uses that combination any more. The variant stays unpublished until the other variant is published first.

The check should read the latest drafts. Note that with `draft: true` the join's `id: { not_equals: data.id }` filter no longer excludes the variant being validated (at least on SQLite), so that variant then has to be excluded from the results by ID instead. Otherwise it is compared with itself and every publish is rejected.

This affects both v3 and v4: the same code ships in `4.0.0-beta.4` and is on `main`.

## Link to the code that reproduces this issue

https://github.com/jhb-software/payload-issue-reproductions/tree/main/variant-duplicate-check-ignores-drafts/

## Reproduction Steps

1. Clone this repo and open the `variant-duplicate-check-ignores-drafts/` directory
2. `pnpm install`
3. `pnpm test:int`: the test publishes variant A with the option "Small", changes A to "Large" in a draft, creates variant B as a draft with "Small", and publishes B.

Publishing B is rejected:

```
× compares against the latest draft of the other variants' options
AssertionError: promise rejected "ValidationError: The following field is invalid: Variant options" instead of resolving
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
