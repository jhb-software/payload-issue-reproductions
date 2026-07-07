import { describe, expect, it } from 'vitest'

/**
 * Bug: hierarchy afterRead hook derives draft intent from `doc._status === 'draft'`
 * instead of the actual request context (e.g. `draft: true` local API arg).
 *
 * Source: packages/payload/src/hierarchy/hooks/collectionAfterRead.ts
 *   draft: doc._status === 'draft',   ← uses child's own status, not request intent
 *
 * Scenario:
 *   - Parent page: published slug "about", then draft updated to slug "about-us"
 *   - Child page: no pending draft changes → _status: 'published'
 *   - Fetch child with `draft: true` (live preview / ?draft=true)
 *
 * Expected: _h_slugPath reflects parent's draft slug → "about-us/child"
 * Actual:   _h_slugPath uses parent's published slug → "about/child"
 *           because `doc._status === 'draft'` is false for the child, so
 *           computePaths receives draft:false and fetches the published parent
 */
describe('hierarchy afterRead: draft context', () => {
  it('should use request draft intent when computing hierarchy paths, not doc._status', async () => {
    // 1. Create and publish parent with slug "about"
    const parent = await payload.create({
      collection: 'pages',
      data: { title: 'About', slug: 'about', _status: 'published' },
    })

    // 2. Save a new draft version of the parent with slug "about-us"
    //    Parent now has: published slug "about", draft slug "about-us"
    await payload.update({
      collection: 'pages',
      id: parent.id,
      draft: true,
      data: { slug: 'about-us' },
    })

    // 3. Create and publish a child page with no pending draft changes
    const child = await payload.create({
      collection: 'pages',
      data: {
        title: 'Child',
        slug: 'child',
        parent: parent.id,
        _status: 'published',
      },
    })

    // Confirm child has no draft changes
    const childPublished = await payload.findByID({
      collection: 'pages',
      id: child.id,
    })
    expect(childPublished._status).toBe('published')

    // 4. Fetch child with draft:true (live preview intent)
    //    The child's _status is 'published', so `doc._status === 'draft'` is false.
    //    Bug: computePaths receives draft:false → fetches published parent → wrong path.
    const draftChild = await payload.findByID({
      collection: 'pages',
      id: child.id,
      draft: true,
      context: { computeHierarchyPaths: true },
    })

    // @ts-expect-error _h_slugPath is a virtual field injected by the hierarchy afterRead hook
    const slugPath: string = draftChild._h_slugPath

    // Should use parent's DRAFT slug "about-us" because the request uses draft:true
    expect(slugPath, 'path should reflect parent draft slug when request uses draft:true').toBe(
      'about-us/child',
    )
  })
})
