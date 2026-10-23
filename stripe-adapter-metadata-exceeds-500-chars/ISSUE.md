## Describe the Bug

The ecommerce plugin's Stripe adapter puts the entire cart into PaymentIntent metadata. Stripe caps every metadata value at [500 characters](https://docs.stripe.com/metadata), so a checkout with more than a few cart items fails:

```
Error: Metadata values can have up to 500 characters, but you passed in a value that is 1090 characters. Invalid value: [{"q...6"}]
```

[`initiatePayment.ts`](https://github.com/payloadcms/payload/blob/v3.92.0/packages/plugin-ecommerce/src/payments/adapters/stripe/initiatePayment.ts#L98-L102) sends `cartItemsSnapshot: JSON.stringify(flattenedCart)`. Each item contributes roughly 60 characters (row `id`, `product`, `quantity`, optional `variant`, plus any custom properties from `cartItemMatcher`), so the limit is reached at around 8 items, and sooner with MongoDB ObjectIDs or custom item properties. The cart can't be checked out at all; the customer just gets `Error initiating payment.`

[`confirmOrder.ts`](https://github.com/payloadcms/payload/blob/v3.92.0/packages/plugin-ecommerce/src/payments/adapters/stripe/confirmOrder.ts#L55-L88) then reads `cartItemsSnapshot` back from the metadata to create the order's `items`. That round-trip isn't needed: `initiatePayment` already stores the same `flattenedCart` on the transaction (`items: flattenedCart`), and `confirmOrder` already loads that transaction. Building the order from `transaction.items` would let `cartItemsSnapshot` be dropped from the metadata entirely.

`shippingAddress` is JSON-stringified into the metadata the same way. A typical address stays under the limit, but an unusually long one would hit the same error.

This affects both v3 and v4: the same code ships in `4.0.0-beta.4` and is on `main`.

## Link to the code that reproduces this issue

https://github.com/jhb-software/payload-issue-reproductions/tree/main/stripe-adapter-metadata-exceeds-500-chars/

## Reproduction Steps

1. Clone this repo and open the `stripe-adapter-metadata-exceeds-500-chars/` directory
2. `pnpm install`
3. `pnpm test:int`: the test creates 12 products and a guest cart holding all of them, then calls `POST /api/payments/stripe/initiate`. `stripe` is mocked, and the mock enforces Stripe's 500-character metadata limit with the real API's error message, so no Stripe account is needed.

The request fails with a 500:

```
ERROR: Error initiating payment with Stripe
    err: {
      "type": "Error",
      "message": "Metadata values can have up to 500 characters, but you passed in a value that is 712 characters.",
    }

FAIL  tests/int.spec.ts > stripeAdapter initiatePayment > initiates a payment for a cart with 12 items
AssertionError: expected 500 to be 200 // Object.is equality
```

## Which area(s) are affected?

plugin: ecommerce

## Environment Info

```
Relevant Packages:
  payload: 3.92.0
  @payloadcms/plugin-ecommerce: 3.92.0
  @payloadcms/db-sqlite: 3.92.0
  stripe: 18.3.0
Node: 22.23.3, pnpm: 11.5.1, darwin arm64
```
