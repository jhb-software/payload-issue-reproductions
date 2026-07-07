# hierarchy-afterread-wrong-draft-context

Reproduction for a bug in the Payload hierarchy `afterRead` hook where `doc._status === 'draft'` is used as a proxy for draft intent, causing incorrect breadcrumb paths when fetching with `draft: true`.

## Steps

```bash
pnpm install
pnpm test:int
```

The test fails showing `about/child` instead of `about-us/child`.

## Related

- PR: https://github.com/payloadcms/payload/pull/15769#discussion_r3029483487
- Issue: https://github.com/payloadcms/payload/issues/16180
