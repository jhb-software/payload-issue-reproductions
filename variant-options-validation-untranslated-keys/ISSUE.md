## Describe the Bug

The variant options validation of the ecommerce plugin shows raw translation keys instead of messages. When an editor saves a variant whose options combination is already in use, the error under "Variant options" reads `ecommerce:variantOptionsAlreadyExists`, and the server logs `key not found: ecommerce:variantOptionsAlreadyExists`.

[`validateOptions`](https://github.com/payloadcms/payload/blob/v3.92.0/packages/plugin-ecommerce/src/collections/variants/createVariantsCollection/hooks/validateOptions.ts#L15) calls `t('ecommerce:…')`, but the plugin [registers its translations](https://github.com/payloadcms/payload/blob/v3.92.0/packages/plugin-ecommerce/src/index.ts#L338) under `plugin-ecommerce`, and the rest of the plugin uses `t('plugin-ecommerce:…')`. The translations themselves exist. All four messages in `validateOptions` are affected: `variantOptionsRequired`, `productRequired`, `variantOptionsRequiredAll` and `variantOptionsAlreadyExists`.

This affects both v3 and v4: the same keys are used in `4.0.0-beta.4` and on `main`.

## Link to the code that reproduces this issue

https://github.com/jhb-software/payload-issue-reproductions/tree/main/variant-options-validation-untranslated-keys/

## Reproduction Steps

1. Clone this repo and open the `variant-options-validation-untranslated-keys/` directory
2. `pnpm install`
3. `pnpm test:int`: the test creates two variants with the same options and checks the validation message of the second.

```
key not found: ecommerce:variantOptionsAlreadyExists
× returns the translated message for a duplicate options combination
Expected: "This variant combo is already in use by another variant. Please select different options."
Received: "ecommerce:variantOptionsAlreadyExists"
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
