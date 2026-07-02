# Payload Issue: Lexical list node missing `tag` and `listType` when saved via API

## Describe the Bug

When a `list` node is saved to a Lexical rich text field via the Payload REST or local API **without** the `tag` and `listType` fields, Payload stores the node as-is — no validation, no defaults.

The Lexical editor always populates these fields on insert. But programmatic API callers (AI agents, MCP tools, migration scripts, REST clients) often don't include them, resulting in malformed data silently persisted to the database.

Because the required fields are missing, any renderer that reads `node.tag` or `node.listType` directly will fail or produce incorrect output. The exact error depends on the renderer.

Note: `listNodeJSONSchema` already declares `tag`, `listType`, and `start` as **required** — but this schema is only used for TypeScript type generation, not for runtime validation at the API layer.

## Link to the code that reproduces this issue

https://github.com/jhb-software/payload-issue-reproductions/tree/main/lexical-list-node-missing-tag-listtype/

## Reproduction Steps

1. Clone https://github.com/jhb-software/payload-issue-reproductions
2. `cd lexical-list-node-missing-tag-listtype`
3. `pnpm install`
4. `pnpm test:int`

The vitest test in `tests/int.spec.ts` fails because `node.tag` and `node.listType` are `undefined` on the saved document.

## Which area(s) are affected?

- plugin: richtext-lexical

## Environment Info

```
Binaries:
  Node: 24.16.0
  pnpm: 11.9.0

Relevant Packages:
  payload: 3.85.1
  @payloadcms/richtext-lexical: 3.85.1
  @payloadcms/db-sqlite: 3.85.1
  next: 15.5.19

Operating System:
  Platform: linux
  Arch: x64
```

## Additional Context

This is increasingly common as AI agents write Lexical JSON and send it to the CMS via MCP or REST. The pattern also affects other node types that declare required fields in their JSON schemas but lack runtime `NodeValidation`:

| Node type | Missing required fields (when sent without them) |
|-----------|--------------------------------------------------|
| `list` | `tag`, `listType`, `start` |
| `heading` | `tag` |
| `tablecell` | `headerState` |
| `listitem` | `value` |

The `link`, `upload`, and `blocks` features already have `NodeValidation` registered — the same mechanism could be used to validate or default the required fields on the above node types.

**Suggested fix:** In the `beforeChange` hook (or via `NodeValidation`), traverse the node tree and either reject documents with invalid list/heading/table nodes, or default the missing fields the same way the Lexical editor would.
