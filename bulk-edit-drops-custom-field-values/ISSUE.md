## Describe the Bug

In the list view's bulk edit drawer ("Edit"), any field rendered by a **custom field component**
silently drops its value. The drawer reports success and bumps `updatedAt`, but the field is never
written.

This affects `@payloadcms/plugin-seo` out of the box: `meta.title`, `meta.description` and
`meta.image` are all custom components, so SEO metadata cannot be bulk edited at all.

### Root cause

1. [`RenderFields/index.tsx#L88`](https://github.com/payloadcms/payload/blob/main/packages/ui/src/forms/RenderFields/index.tsx#L88)
   wraps every field in a `<FieldPathContext value={path}>` provider. This is what makes custom
   components work in the normal document edit view.
2. [`EditMany/DrawerContent.tsx#L409`](https://github.com/payloadcms/payload/blob/main/packages/ui/src/elements/EditMany/DrawerContent.tsx#L409)
   calls `RenderField` directly rather than going through `RenderFields`, so there is no
   `FieldPathContext` provider. It passes `path` as a prop instead.
3. [`RenderField.tsx#L71`](https://github.com/payloadcms/payload/blob/main/packages/ui/src/forms/RenderFields/RenderField.tsx#L71)
   short-circuits for custom components: `if (CustomField !== undefined) { return CustomField }`.
   `CustomField` is a pre-rendered element taken from form state, so the `path` prop is dropped.
4. [`MetaTitleComponent.tsx#L62`](https://github.com/payloadcms/payload/blob/main/packages/plugin-seo/src/fields/MetaTitle/MetaTitleComponent.tsx#L62)
   (and `MetaDescriptionComponent.tsx#L69`, `MetaImageComponent.tsx#L53`) calls `useField()` with no
   arguments. `useField` falls back to `useFieldPath()`
   ([`useField/index.tsx#L40`](https://github.com/payloadcms/payload/blob/main/packages/ui/src/forms/useField/index.tsx#L40)),
   which returns `undefined`.
5. `setValue` therefore writes to the form-state key `undefined`. On submit,
   `reduceFieldsToValues(fields, true)` unflattens that into a top-level `"undefined"` property.
6. Server-side `"undefined"` is not a field in the schema and is discarded, so nothing is written —
   but the update still succeeds with `200 OK`.

The `FieldPathContext` docblock
([`RenderFields/context.ts#L6`](https://github.com/payloadcms/payload/blob/main/packages/ui/src/forms/RenderFields/context.ts#L6))
warns about exactly this: *"if you render a field directly, you will need to wrap it with a new
`FieldPathContext` provider."* `EditMany/DrawerContent.tsx` does not. Note that
`BulkUpload/EditMany/DrawerContent.tsx#L196` does use the provider (with `value={undefined}`), so the
two EditMany implementations diverge here.

This is the custom-component half of the same defect as #10571, which was closed as a duplicate of
the group bug #10019 and fixed at the group level in v3.29.0.

### Observed behaviour in the reproduction

The input rendered in the drawer gets `id="field-undefined"`, and the PATCH body is:

```json
{ "undefined": "seo only bulk title", "meta": {} }
```

A plain custom text field (no plugin involved) behaves identically, confirming the bug is in
`@payloadcms/ui` and not in `plugin-seo`:

```json
{ "undefined": "customtext only" }
```

## Link to the code that reproduces this issue

https://github.com/jhb-software/payload-issue-reproductions/tree/main/bulk-edit-drops-custom-field-values/

## Reproduction Steps

1. Clone this repo and open the `bulk-edit-drops-custom-field-values/` directory
2. `pnpm install && cp .env.example .env`
3. `pnpm dev` and log in at http://localhost:3000/admin as `dev@example.com` / `test`
   (two pages are seeded on first start)
4. Go to **Collections → Pages**, tick the select-all checkbox, press **Edit**
5. In "Select fields to edit" choose **SEO > Title**, type any value, press **Save**
6. **Expected**: `meta.title` is updated on both pages.
   **Actual**: the toast says "2 Pages successfully updated" and `updatedAt` is bumped, but
   `meta.title` is unchanged. The input's id is `field-undefined` and the PATCH body contains
   `{"undefined": "<your value>", "meta": {}}`.

Selecting **Custom Text** instead — a plain custom component defined in this reproduction that calls
`useField()` the same way plugin-seo does — reproduces the same result without any plugin.

## Which area(s) are affected?

area: ui
plugin: seo

## Environment Info

```
Binaries:
  Node: 22.19.0
  npm: 10.9.3
  Yarn: N/A
  pnpm: 11.5.1
Relevant Packages:
  payload: 3.88.0
  next: 16.3.4
  @payloadcms/db-sqlite: 3.88.0
  @payloadcms/drizzle: 3.88.0
  @payloadcms/graphql: 3.88.0
  @payloadcms/next/utilities: 3.88.0
  @payloadcms/plugin-seo: 3.88.0
  @payloadcms/richtext-lexical: 3.88.0
  @payloadcms/translations: 3.88.0
  @payloadcms/ui/shared: 3.88.0
  react: 19.2.8
  react-dom: 19.2.8
Operating System:
  Platform: darwin
  Arch: arm64
  Available memory (MB): 24576
  Available CPU cores: 14
```
