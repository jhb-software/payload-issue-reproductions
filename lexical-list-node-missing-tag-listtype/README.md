# Reproduction: Lexical list node missing `tag` and `listType` when saved via API

Minimal reproduction for a Payload CMS GitHub issue.

## The Bug

When a `list` node is saved to a Lexical rich text field via the Payload REST or local API **without** `tag` and `listType` fields, Payload stores it as-is — no validation, no defaults.

The Lexical editor always sets these fields on insert. Programmatic callers (AI agents, MCP tools, REST clients, migration scripts) often don't — resulting in malformed data silently persisted to the database.

## Steps to reproduce

```bash
pnpm install
pnpm test:int
```

The test in `tests/int.spec.ts` fails: `node.tag` and `node.listType` are `undefined` on the saved document.

## Environment

- payload: 3.85.1
- @payloadcms/richtext-lexical: 3.85.1
- Node: 24.16.0 / pnpm: 11.9.0
