import { vi } from 'vitest'

declare global {
  // eslint-disable-next-line no-var
  var createdPaymentIntents: { metadata: Record<string, string> }[]
}

global.createdPaymentIntents = []

// Stand-in for the Stripe API, so no Stripe account is needed. `paymentIntents.create` enforces
// Stripe's documented metadata limit (values up to 500 characters, https://docs.stripe.com/metadata)
// with the same error message the real API returns.
vi.mock('stripe', () => ({
  default: function MockStripe() {
    return {
      customers: {
        create: async ({ email }: { email: string }) => ({ id: 'cus_123', email }),
        list: async () => ({ data: [] }),
      },
      paymentIntents: {
        create: async (params: { amount: number; currency: string; metadata: Record<string, string> }) => {
          for (const value of Object.values(params.metadata)) {
            if (value.length > 500) {
              throw new Error(
                `Metadata values can have up to 500 characters, but you passed in a value that is ${value.length} characters.`,
              )
            }
          }
          global.createdPaymentIntents.push(params)
          return { ...params, id: 'pi_123', client_secret: 'pi_123_secret' }
        },
      },
    }
  },
}))
