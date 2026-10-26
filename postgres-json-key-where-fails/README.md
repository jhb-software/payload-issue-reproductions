# postgres-json-key-where-fails

Reproduction for two Payload 3 bugs in the Postgres adapter's `createJSONQuery` (`@payloadcms/drizzle`), which builds `where` clauses on nested keys of `json` fields:

1. The JSON column is referenced without its table (`jsonb_path_exists(data, ...)`). If the field is named `data` and the collection has any field loaded through a lateral join (array, blocks, `hasMany` relationship, localized field, `hasMany` text), the query fails with `column reference "data" is ambiguous`, because the lateral join subqueries also output a column named `data`.
2. `less_than`, `greater_than`, `less_than_equal` and `greater_than_equal` are missing from its `operatorMap`, so they produce the jsonpath `(@ undefined "...")`, which Postgres rejects as a syntax error.

## Steps

```bash
pnpm install
docker compose up -d   # or point DATABASE_URI at any Postgres database
pnpm test:int
```

5 of 6 tests fail: one for bug 1, four for bug 2 (one per range operator). The `equals` control test passes.
