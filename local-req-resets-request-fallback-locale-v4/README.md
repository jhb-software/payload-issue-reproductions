# local-req-resets-request-fallback-locale-v4

Reproduction for a Payload 4 (beta) bug: a Local API call that passes `req` and names no `locale` and no `fallbackLocale` inherits `req.locale`, but not `req.fallbackLocale`. `createPayloadRequest` recomputes the fallback from the config (`localization.defaultLocale`) and writes it back onto the caller's `req`. A request's own fallback locale (e.g. `?fallback-locale=de`) is therefore ignored by the nested call and lost for everything after it.

A v3 version of this reproduction lives in [`../local-req-resets-request-fallback-locale`](../local-req-resets-request-fallback-locale/).

## Steps

```bash
pnpm install
pnpm test:int
```

Both tests fail. They pass when `createPayloadRequest` falls back to `req.fallbackLocale` when no `fallbackLocale` is passed.
