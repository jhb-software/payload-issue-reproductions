# variant-options-validation-untranslated-keys

Reproduction for a Payload 3 bug in `@payloadcms/plugin-ecommerce`: the variants `options` validation (`validateOptions`) returns its messages via `t('ecommerce:…')`, but the plugin registers its translations under `plugin-ecommerce`. Editors see the raw key (e.g. `ecommerce:variantOptionsAlreadyExists`) instead of the message, and `key not found` is logged.

The test creates two variants with the same options and checks the validation message of the second.

## Steps

```bash
pnpm install
pnpm test:int
```

The test fails. It passes when the four keys in `validateOptions` use the `plugin-ecommerce:` prefix.
