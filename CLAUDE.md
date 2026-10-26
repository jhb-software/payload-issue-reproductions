# payload-issue-reproductions

Public repo with minimal reproductions for [Payload CMS](https://github.com/payloadcms/payload)
GitHub issues. One folder per issue, each linked from the corresponding Payload issue and indexed in
`README.md`.

To create a reproduction, use the **`create-reproduction` skill** — it is the single source of truth
for folder layout, `ISSUE.md` format, triage-bot requirements, and the filing workflow. Do not
improvise a reproduction without it.

> Every reproduction and every GitHub issue must be reviewed and approved by Jens before it is filed
> publicly. Never open an issue autonomously.

> A bug that affects both v3 and v4 gets a separate `-v4` reproduction and issue only if the root
> cause or the fix differs between them. If both share the same root cause and fix, file one issue
> and note in it that v4 is also affected.

> This repo and the issues filed from it are public. Bugs found in private projects must be rebuilt
> from generic primitives — no client or project names, no domain-specific slugs, no real data,
> credentials, URLs, or screenshots of a private admin panel.
