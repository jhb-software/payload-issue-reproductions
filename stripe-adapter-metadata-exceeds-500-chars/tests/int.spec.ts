import { handleEndpoints } from 'payload'
import { describe, expect, it } from 'vitest'

import config from '../src/payload.config.js'

describe('stripeAdapter initiatePayment', () => {
  it('initiates a payment for a cart with 12 items', async () => {
    const products = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        payload.create({
          collection: 'products',
          data: { _status: 'published', inventory: 10, priceInUSD: 1000, priceInUSDEnabled: true, title: `Product ${i + 1}` } as any,
        }),
      ),
    )

    const cart = await payload.create({
      collection: 'carts',
      data: {
        currency: 'USD',
        customerEmail: 'guest@example.com',
        items: products.map((product) => ({ product: product.id, quantity: 1 })),
      } as any,
    })

    const response = await handleEndpoints({
      config,
      request: new Request('http://localhost:3000/api/payments/stripe/initiate', {
        body: JSON.stringify({
          cartID: cart.id,
          customerEmail: 'guest@example.com',
          secret: (cart as any).secret,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      }),
    })
    const body = await response.json()

    console.log('response:', response.status, body)

    // Expected: the payment is initiated.
    // Actual: the adapter writes JSON.stringify(cart items) into `metadata.cartItemsSnapshot`, which
    // exceeds Stripe's 500-character limit, so Stripe rejects the PaymentIntent.
    expect(response.status).toBe(200)
    expect(createdPaymentIntents).toHaveLength(1)
  })
})
