## Describe the Bug

`where` filters on nested keys of a `json` field fail in two ways on Postgres. Both are in [`createJSONQuery`](https://github.com/payloadcms/payload/blob/v3.92.0/packages/drizzle/src/postgres/createJSONQuery/index.ts) in `@payloadcms/drizzle`, which is unchanged on `main`.

**1. The column is not qualified with its table, so it is ambiguous next to any join.** [Line 43](https://github.com/payloadcms/payload/blob/v3.92.0/packages/drizzle/src/postgres/createJSONQuery/index.ts#L43) uses the bare column name (`column.name`), producing `jsonb_path_exists(data, ...)`. `find` loads arrays, blocks, `hasMany` relationships, localized fields and `hasMany` text/number fields through `left join lateral (select ... as "data" ...)` subqueries, which all name their output column `data`. So a `json` field named `data`, on a collection that has any of those fields, can't be queried by a nested key:

```ts
// collection 'posts': { name: 'data', type: 'json' }, { name: 'items', type: 'array', fields: [{ name: 'label', type: 'text' }] }
await payload.find({ collection: 'posts', where: { 'data.publishedAt': { exists: true } } })
```

```
select "posts"."id", "posts"."data", ..., "posts_items"."data" as "items" from "posts" "posts" left join lateral (select coalesce(json_agg(...), '[]'::json) as "data" from (...) "posts_items") "posts_items" on true where jsonb_path_exists(data, '$.publishedAt[*]') order by "posts"."created_at" desc limit $1
error: column reference "data" is ambiguous
```

I confirmed this with an array, blocks, a `hasMany` relationship, a localized field and a `hasMany` text field. It does not happen when the JSON field has another name (e.g. `meta`), or with no join (the `count(*)` query has no joins).

**2. The range operators are not supported.** The [`operatorMap`](https://github.com/payloadcms/payload/blob/v3.92.0/packages/drizzle/src/postgres/createJSONQuery/index.ts#L8-L16) only has `contains`, `equals`, `in`, `like`, `not_equals`, `not_in` and `not_like`. `less_than`, `greater_than`, `less_than_equal` and `greater_than_equal` fall through to the default branch and produce `undefined` as the jsonpath operator. This happens on a collection with only a `json` field:

```ts
await payload.find({ collection: 'pages', where: { 'data.publishedAt': { less_than: '2026-10-26T00:10:00.000Z' } } })
```

```
select count(*) from "pages" where jsonb_path_exists(data, '$.publishedAt[*] ? (@ undefined "2026-10-26T00:10:00.000Z")')
error: syntax error at or near " " of jsonpath input
```

The value is not the problem: `SAFE_STRING_REGEX` (`/^[\w @.\-+:]*$/`) accepts ISO timestamps, and `equals` with the same value works.

**Expected:** both queries return the matching document. Unsupported operators should at least return a clear validation error instead of invalid SQL.

**Suggested fix:** applying both changes to the installed `dist` makes all tests in the reproduction pass:

```ts
import { getTableName } from 'drizzle-orm'

const operatorMap: Record<string, string> = {
  contains: '~',
  equals: '==',
  greater_than: '>',
  greater_than_equal: '>=',
  in: 'in',
  less_than: '<',
  less_than_equal: '<=',
  like: 'like_regex',
  not_equals: '!=',
  not_in: 'in',
  not_like: '!like_regex',
}

// ...
const columnName =
  typeof column === 'object' ? `"${getTableName(column.table)}"."${column.name}"` : column
```

(jsonpath compares strings lexicographically, which gives the correct order for ISO timestamps.)

## Link to the code that reproduces this issue

https://github.com/jhb-software/payload-issue-reproductions/tree/main/postgres-json-key-where-fails/

## Reproduction Steps

1. Clone this repo and open the `postgres-json-key-where-fails/` directory
2. `pnpm install`
3. `docker compose up -d` (or set `DATABASE_URI` to any Postgres database)
4. `pnpm test:int`: 5 of 6 tests fail. The `equals` control test passes.

```
× bug 1: JSON key filter uses an unqualified column > finds the post by a nested JSON key
    error: column reference "data" is ambiguous
✓ bug 2: JSON key filter has no range operators > control: equals works on the same key
× bug 2: JSON key filter has no range operators > less_than compares the JSON key
× bug 2: JSON key filter has no range operators > less_than_equal compares the JSON key
× bug 2: JSON key filter has no range operators > greater_than compares the JSON key
× bug 2: JSON key filter has no range operators > greater_than_equal compares the JSON key
    error: syntax error at or near " " of jsonpath input
```

## Which area(s) are affected?

db: postgres

## Environment Info

```
Binaries:
  Node: 22.23.3
  npm: 10.9.9
  Yarn: N/A
  pnpm: 11.5.1
Relevant Packages:
  payload: 3.92.0
  @payloadcms/db-postgres: 3.92.0
  @payloadcms/drizzle: 3.92.0
  @payloadcms/translations: 3.92.0
Operating System:
  Platform: darwin
  Arch: arm64
  Version: Darwin Kernel Version 24.6.0
  Available memory (MB): 24576
  Available CPU cores: 14
```
