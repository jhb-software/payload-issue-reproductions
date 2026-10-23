# stripe-adapter-metadata-exceeds-500-chars

Reproduction for a Payload 3 bug in `@payloadcms/plugin-ecommerce`: the Stripe adapter's `initiatePayment` writes the whole cart (`JSON.stringify(flattenedCart)`) into the PaymentIntent's `metadata.cartItemsSnapshot`. Stripe allows at most 500 characters per metadata value, so a cart with more than a handful of items can't be checked out. Stripe rejects the PaymentIntent with `Metadata values can have up to 500 characters, but you passed in a value that is N characters`.

The test creates 12 products and a guest cart holding all of them, then calls `POST /api/payments/stripe/initiate`. `stripe` is mocked (`tests/stripe-mock.ts`), so no Stripe account is needed. The mock enforces Stripe's 500-character metadata limit with the same error message as the real API.

## Steps

```bash
pnpm install
pnpm test:int
```

The test fails with a 500 response. It passes once the adapter stops putting the unbounded cart snapshot into Stripe metadata.
