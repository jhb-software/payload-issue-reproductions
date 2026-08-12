# lexical-link-picker-ignores-tenant-filter

The lexical internal link picker ignores the selected tenant when `LinkFeature` is configured with `enabledCollections` — editors can link to the documents of every tenant.

Two causes combine:

- `LinkFeature` sets `filterOptions: null` on its `doc` field as soon as `enabledCollections` (or `disabledCollections`) is passed, dropping the `admin.baseFilter` lookup that normally carries the tenant scope.
- `plugin-multi-tenant`'s `addFilterOptionsToFields` never recurses into `richText` fields, so it cannot add the tenant filter itself.

## Steps to reproduce

```bash
pnpm install
pnpm test:int
```

`tests/int.spec.ts` resolves the `filterOptions` of three pickers on `posts` with a `payload-tenant` cookie set, like the admin panel does: a plain relationship field (passes), a default `LinkFeature` link (passes), and a `LinkFeature({ enabledCollections: ['pages'] })` link (**fails** — `filterOptions` is `null`).

Verified on 3.87.1.

See [ISSUE.md](./ISSUE.md).
