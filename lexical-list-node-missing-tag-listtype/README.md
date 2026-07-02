# Reproduction: Lexical list node missing `tag` and `listType` when inserted via API

## Issue

When a Lexical list node is inserted programmatically via the Payload REST API (or local API), the resulting node is missing the `tag` and `listType` fields that the Lexical editor normally populates automatically.

This causes rendering to fail in any renderer that reads `node.tag` directly (e.g. `const Tag = node.tag` → `<Tag>...</Tag>` → crash when `Tag` is `undefined`).

## Expected behavior

A list node should always have `tag` (`"ul"` or `"ol"`) and `listType` (`"bullet"`, `"number"`, or `"check"`), regardless of whether it was created via the editor UI or the API.

## Actual behavior

```json
{
  "type": "list",
  "version": 1,
  "format": "",
  "indent": 0,
  "direction": "ltr",
  "children": [{ "type": "listitem", "version": 1, "value": 1, "checked": false, "indent": 0, "direction": "ltr", "children": [] }]
}
```

Note: `tag` and `listType` are absent. The Lexical editor always adds these, but the API does not validate or default them.

## Steps to reproduce

1. Install dependencies: `pnpm install`
2. Start Payload: `pnpm dev`
3. Run the reproduction script: `pnpm repro`

The script creates a document with a rich text field containing a list node (no `tag`/`listType`) via the Payload local API, then reads it back and prints the stored node.

## Environment

- Payload CMS: latest
- `@payloadcms/richtext-lexical`: latest
- Node.js: 20+

## Workaround

Add a default in the renderer: `const Tag = node.tag ?? 'ul'`. This is defensive but does not fix the root cause (malformed data in the DB).

The correct fix is for Payload to validate or default `tag` and `listType` on list nodes before saving, similar to how the Lexical editor normalizes them on insert.
