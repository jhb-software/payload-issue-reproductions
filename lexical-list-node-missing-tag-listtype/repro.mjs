// Reproduction script: inserts a list node without tag/listType via Payload local API
// and prints the stored node to show the missing fields.

import { getPayload } from 'payload'
import config from './payload.config.ts'

const payload = await getPayload({ config })

// Insert a list node without tag/listType — as a programmatic API call would
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
            // Intentionally omitting "tag" and "listType" — as MCP/API inserts might do
            children: [
              {
                type: 'listitem',
                version: 1,
                value: 1,
                checked: false,
                indent: 0,
                direction: 'ltr',
                children: [{ type: 'text', version: 1, text: 'Item 1', format: 0, detail: 0, mode: 'normal', style: '' }],
              },
            ],
          },
        ],
      },
    },
  },
})

const listNode = doc.content.root.children[0]

console.log('\nStored list node:')
console.log(JSON.stringify(listNode, null, 2))

console.log('\n--- Reproduction result ---')
if (!listNode.tag) {
  console.log('BUG CONFIRMED: "tag" is missing on the stored list node.')
  console.log('Rendering "const Tag = node.tag; <Tag>..." will throw "Unable to render Tag because it is undefined!"')
} else {
  console.log('No bug: "tag" is present:', listNode.tag)
}

await payload.db.destroy()
