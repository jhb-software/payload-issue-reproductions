## Describe the Bug

A Local API call that passes `req` and names **no** `locale` and **no** `fallbackLocale` inherits the request's `locale`, but not its `fallbackLocale`. [`createPayloadRequest`](https://github.com/payloadcms/payload/blob/v4.0.0-beta.2/packages/payload/src/utilities/createPayloadRequest.ts#L116-L127) treats the two asymmetrically: `locale` falls back to `req.locale`, while `fallbackLocale` is passed to [`sanitizeFallbackLocale`](https://github.com/payloadcms/payload/blob/v4.0.0-beta.2/packages/payload/src/utilities/sanitizeFallbackLocale.ts) as `undefined`, which maps it to `localization.defaultLocale`. The result is written back onto the caller's `req`:

```ts
const localeCandidate = locale || req?.locale || req?.query?.locale // inherits req
req.locale = localeCandidate && typeof localeCandidate === 'string' ? localeCandidate : defaultLocale
const sanitizedFallback = sanitizeFallbackLocale({
  fallbackLocale: fallbackLocale!, // never looks at req.fallbackLocale
  locale: req.locale,
  localization,
})
req.fallbackLocale = sanitizedFallback!
```

So a request's own fallback locale, e.g. one a REST client sent as `?fallback-locale=de`, is lost in two ways:

1. **For the nested call itself:** it falls back to `defaultLocale` instead of the request's fallback.
2. **For everything after it on that `req`:** `req.fallbackLocale` now holds `defaultLocale`.

In the reproduction, a custom endpoint called with `?locale=en&fallback-locale=de` runs `req.payload.find({ collection: 'posts', req })`. The only post has a title in `de` only. Expected `title: 'Nur auf Deutsch'` and `req.fallbackLocale === 'de'` afterwards; actual `title: null` and `req.fallbackLocale === 'en'`.

This is related to, but separate from, #18246 (a nested call with `req` and a **different** `locale` rewrites the caller's `req.locale` and `req.fallbackLocale`). Here nothing is named and the request's fallback is still replaced, so fixing #18246 by isolating `req` only when a different locale is named would not fix this.

**Suggested fix:** when the call names no fallback, keep the request's. `req.fallbackLocale` is already sanitized (`false`, a locale code, or an array), and `sanitizeFallbackLocale` passes each of those through unchanged. Calls without `req` behave as before. With this change both tests pass:

```diff
-      fallbackLocale: fallbackLocale!,
+      fallbackLocale: fallbackLocale ?? req?.fallbackLocale,
```

The same bug exists in v3 (`createLocalReq`): [v3 issue]

## Link to the code that reproduces this issue

https://github.com/jhb-software/payload-issue-reproductions/tree/main/local-req-resets-request-fallback-locale-v4/

## Reproduction Steps

1. Clone this repo and open the `local-req-resets-request-fallback-locale-v4/` directory
2. `pnpm install`
3. `pnpm test:int`: both tests fail

```
FAIL  keeps the request fallback locale (custom endpoint, ?locale=en&fallback-locale=de)
endpoint response: { fallbackAfter: 'en', fallbackBefore: 'de', title: null }
- Expected: { fallbackAfter: 'de', fallbackBefore: 'de', title: 'Nur auf Deutsch' }

FAIL  createPayloadRequest keeps req.fallbackLocale when no fallbackLocale is passed
Expected: "de"
Received: "en"
```

## Which area(s) are affected?

area: core

## Environment Info

```
Relevant Packages:
  payload: 4.0.0-beta.1
  @payloadcms/db-sqlite: 4.0.0-beta.1
Node: 22.19.0, pnpm: 11.5.1, darwin arm64
```

The code is unchanged in `4.0.0-beta.2` and on `main`.
