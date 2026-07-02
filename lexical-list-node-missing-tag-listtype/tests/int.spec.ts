import { describe, expect, it } from 'vitest'

describe('Lexical list node: tag and listType', () => {
  it('should default tag and listType when a list node is saved via the API without them', async () => {
    // Simulate a programmatic API caller (MCP tool, REST client, migration script)
    // sending a list node without "tag" or "listType".
    // The Lexical editor always sets these fields, but API callers may not.
    const doc = await payload.create({
      collection: 'pages',
      data: {
        content: {
          root: {
            type: 'root',
            version: 1,
            format: '',
            indent: 0,
            direction: 'ltr',
            children: [
              {
                type: 'list',
                version: 1,
                format: '',
                indent: 0,
                direction: 'ltr',
                // "tag" and "listType" intentionally omitted
                children: [
                  {
                    type: 'listitem',
                    version: 1,
                    value: 1,
                    checked: false,
                    indent: 0,
                    direction: 'ltr',
                    children: [
                      {
                        type: 'text',
                        version: 1,
                        text: 'Item 1',
                        format: 0,
                        detail: 0,
                        mode: 'normal',
                        style: '',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    })

    const listNode = doc.content.root.children[0] as Record<string, unknown>

    // Currently FAILS — node is stored without tag/listType.
    // Renderers that use `const Tag = node.tag; <Tag>...</Tag>` crash:
    // "Unable to render Tag because it is undefined!"
    expect(listNode.tag, '"tag" should be defaulted to "ul"').toBeDefined()
    expect(listNode.listType, '"listType" should be defaulted to "bullet"').toBeDefined()
  })
})
