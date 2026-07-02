# Lexical list node missing `tag` and `listType` when saved via API

## Summary

When a `list` node is saved to a Lexical rich text field via the Payload REST or local API
**without** `tag` and `listType` fields, Payload stores it as-is — no validation, no defaults.

The Lexical editor always populates these fields on insert, so this only surfaces when content
is created or updated programmatically (e.g. via MCP tools, migration scripts, or REST clients).

Downstream renderers that use `node.tag` directly (e.g. `const Tag = node.tag; <Tag>...</Tag>`)
crash at build time:

```
Unable to render Tag because it is undefined!
```

## Expected behavior

Payload should either:
- **Default** `tag` to `"ul"` and `listType` to `"bullet"` when these fields are absent on a list node (same as what the Lexical editor does), or
- **Reject** the document with a validation error so the caller knows the node is malformed.

## Actual behavior

The node is stored without `tag` and `listType`. Reads return the malformed node, causing
renderers to crash.

## Steps to reproduce

```bash
git clone https://github.com/payloadcms/payload
cd payload
# copy config.ts and int.spec.ts into test/_community/
pnpm dev:generate-types _community
pnpm test:int _community
```

The test in `int.spec.ts` fails, confirming the missing fields.

## Environment

- Payload: latest
- `@payloadcms/richtext-lexical`: latest
