## Describe the Bug

With `@payloadcms/plugin-multi-tenant`, the lexical internal link picker is not scoped to the selected tenant when `LinkFeature` is configured with `enabledCollections` (or `disabledCollections`). Editors see — and can link to — the documents of every tenant, ignoring the tenant switcher.

```ts
lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    LinkFeature({
      enabledCollections: ['pages'], // <- picker is no longer tenant filtered
    }),
  ],
})
```

Two things have to line up for this:

**1. `LinkFeature` drops its `filterOptions` when `enabledCollections` is set.**

In `richtext-lexical/src/features/link/server/baseFields.ts`, the `doc` relationship field only gets a `filterOptions` function when neither `enabledCollections` nor `disabledCollections` is passed — otherwise it is explicitly `null`:

```ts
filterOptions:
  !enabledCollections && !disabledCollections
    ? async ({ relationTo, req, user }) => {
        // ...
        const baseFilter = admin?.baseFilter ?? admin?.baseListFilter
        return (await baseFilter?.({ limit: 0, page: 1, req, sort: 'id' })) ?? true
      }
    : null,
```

That branch is what carries the tenant scope in the default case: the multi-tenant plugin sets `admin.baseFilter` on every tenant-enabled collection, and the picker inherits it. `enabledCollections` only decides *which collections* are linkable, so it should not disable the `admin.hidden` check and the `baseFilter` lookup as well.

**2. The multi-tenant plugin cannot compensate, because it never recurses into `richText`.**

`plugin-multi-tenant/src/utilities/addFilterOptionsToFields.ts` walks `row`, `array`, `collapsible`, `group`, `blocks` and `tabs` to add a tenant `filterOptions` to nested relationship fields, but it has no `richText` branch. The `doc` field of the link feature lives inside the editor's sanitized feature fields, so the plugin never sees it. Without the `baseFilter` fallback above, nothing scopes the picker at all.

## Link to the code that reproduces this issue

https://github.com/jhb-software/payload-issue-reproductions/tree/main/lexical-link-picker-ignores-tenant-filter/

## Reproduction Steps

1. Clone this repo / open the `lexical-link-picker-ignores-tenant-filter` folder
2. `pnpm install`
3. `pnpm test:int`

The `posts` collection has three tenant-scoped pickers pointing at the tenant-enabled `pages` collection. The test resolves each field's `filterOptions` with `payload-tenant` set in the request cookie, exactly like the admin panel does when a tenant is selected:

- `relatedPage` — a plain relationship field (control) — passes, returns `{ tenant: { in: [1] } }`
- `contentDefaultLinkFeature` — richText with the default `LinkFeature` (control) — passes, returns `{ and: [{ tenant: { in: [1] } }] }`
- `contentEnabledCollections` — richText with `LinkFeature({ enabledCollections: ['pages'] })` — **fails**

```
AssertionError: expected null not to be null

 ❯ tests/int.spec.ts:77:35
```

`filterOptions` is `null`, so the picker in the admin panel lists the pages of all tenants.

## Which area(s) are affected?

- plugin: richtext-lexical
- plugin: multi-tenant

## Environment Info

```
Binaries:
  Node: 22.19.0
  npm: 10.9.3
  Yarn: N/A
  pnpm: 11.5.1
Relevant Packages:
  payload: 3.87.1
  next: 15.5.23
  @payloadcms/db-sqlite: 3.87.1
  @payloadcms/drizzle: 3.87.1
  @payloadcms/graphql: 3.87.1
  @payloadcms/next/utilities: 3.87.1
  @payloadcms/plugin-multi-tenant: 3.87.1
  @payloadcms/richtext-lexical: 3.87.1
  @payloadcms/translations: 3.87.1
  @payloadcms/ui/shared: 3.87.1
  react: 19.2.8
  react-dom: 19.2.8
Operating System:
  Platform: darwin
  Arch: arm64
  Version: Darwin Kernel Version 24.6.0: Tue Apr 21 20:19:12 PDT 2026; root:xnu-11417.140.69.710.16~1/RELEASE_ARM64_T6041
  Available memory (MB): 24576
  Available CPU cores: 14
```
