import { ProductsGetNQuery, CartGetQuery, CartPutMutation } from "./types/storefront.generated.js"
import { Checkout, CartLineInput } from './types/storefront.types.js'

import { AppStorage } from './Storage.js'

import {
  createStorefrontApiClient,
  StorefrontApiClient,
} from '@shopify/storefront-api-client'

import {
  ResponseErrors
} from '@shopify/graphql-client'

/*
- Shopify
  - [Storefront API Reference](https://github.com/Shopify/shopify-api-js/tree/main/packages/storefront-api-client)
  - [Storefront API Guide](https://shopify.dev/docs/custom-storefronts/building-with-the-storefront-api/getting-started)
  - [GraphQL Explorer](https://shopify.dev/docs/custom-storefronts/building-with-the-storefront-api/api-exploration/graphiql-storefront-api)
  - [My Store](https://admin.shopify.com/store/ac5ca1-cd/)

   remember to run `yarn graphql-codegen` after adding or modifying graphql code here.
  */
const CHECKOUT_ID_STORAGE_KEY = 'CHECKOUT_ID_STORAGE_KEY.1'
export class ShopifyAPI {
  cartId?: string
  client!: StorefrontApiClient
  storage!: AppStorage

  init(args: { storeDomain: string, publicAccessToken: string }): ShopifyAPI {
    this.client = createStorefrontApiClient({ apiVersion: '2024-01', ...args })
    // this.cartId = this.storage.get(CHECKOUT_ID_STORAGE_KEY)
    return this
  }

  errorsThrow(errors: ResponseErrors) {
    var msg = errors.message + "\n" + JSON.stringify(errors.graphQLErrors)
    throw new Error(msg)
  }

  async productsGetN(n: number): Promise<ProductsGetNQuery> {
    const { data, errors, extensions } = await this.client.request(`#graphql
    query ProductsGetN($n: Int!) {
      products(first: $n) {
        edges {
          node {
            id
            variants(first: 1) {
              edges {
                node {
                  id
                }
              }
            }
            title
            handle
            description
            images(first: 1) {
              edges {
                node {
                  src
                  altText
                }
              }
            }
          }
        }
      }
    }`, { variables: { n } })

    if (errors != null) {
      this.errorsThrow(errors)
    } else if (data === undefined) {
      throw new Error("no data for ProductsGetN. bad query?")
    }
    return data!
  }

  public async cartGet(): Promise<CartGetQuery['cart']> {
    if (this.cartId == null) return null

    const { data, errors, extensions } = await this.client.request(`#graphql
query CartGet($cartId: ID!) {
  cart(id: $cartId) {
    id
    checkoutUrl
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      subtotalAmountEstimated
      totalAmount {
        amount
        currencyCode
      }
      totalAmountEstimated
      totalDutyAmount {
        amount
        currencyCode
      }
      totalDutyAmountEstimated
      totalTaxAmount {
        amount
        currencyCode
      }
      totalTaxAmountEstimated
    }
    totalQuantity
    lines(first: 250) { # Adjust the 'first' parameter as needed, up to Shopify's maximum allowed
      edges {
        node {
          id
          cost {
            amountPerQuantity {
              amount
              currencyCode
            }
            compareAtAmountPerQuantity {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
            totalAmount {
              amount
              currencyCode
            }
          }
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              unitPrice {
                amount
                currencyCode
              }
              price {
                amount
                currencyCode
              }
              product {
                id
                title
                description
                images(first: 1) {
                  edges {
                    node {
                      src
                      altText
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`, { variables: { cartId: this.cartId } })

    if (errors != null) {
      this.errorsThrow(errors)
    }

    if (data === undefined) {
      throw new Error("not cart data... bad query?")
    } else {
      return data.cart
    }
  }

  private async cartPut(lines: CartLineInput[]): Promise<void> {
    const { data, errors, extensions } = await this.client.request(`#graphql
mutation cartPut($input: CartInput!) {
  cartCreate(input: $input) {
    cart {
      id
      checkoutUrl
    }
    userErrors {
      field
      message
    }
  }
}`, { variables: { input: { lines } } })

    if (errors != null) {
      this.errorsThrow(errors)
    }

    if (data === undefined) {
      throw new Error("no cart data... bad query?")
    } else if (data.cartCreate === undefined) {
      throw new Error("no cartCreate data... bad query?")
    } else if (data.cartCreate!.cart === undefined) {
      throw new Error("no cartCreate data... bad query?")
    } else {
      this.cartId = data.cartCreate!.cart!.id
      this.storage.put(CHECKOUT_ID_STORAGE_KEY, this.cartId)
    }
  }

  public async cartLinesAdd(lines: CartLineInput[]): Promise<void> {
    if (this.cartId == null) {
      this.cartPut(lines)
    }

    const { data, errors, extensions } = await this.client.request(`#graphql
mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    cart {
      id
      checkoutUrl
    }
    userErrors {
      field
      message
    }
  }
}`, { variables: { cartId: this.cartId!, lines: lines } })
    if (errors != null) {
      this.errorsThrow(errors)
    }
  }

  public async cartLinesRemove(lineIds: string[]): Promise<Checkout> {
    if (this.cartId == null) {
      throw new Error("No cart ID found to remove lines from.")
    }

    const { data, errors, extensions } = await this.client.request(`#graphql
mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
  cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
    cart {
      id
      checkoutUrl
    }
    userErrors {
      field
      message
    }
  }
}`, { variables: { cartId: this.cartId, lineIds: lineIds } })

    if (errors != null) {
      this.errorsThrow(errors)
    }

    return data.cartLinesRemove.cart
  }

  public async cartLinesUpdate(lineId: string, qty: number): Promise<Checkout> {
    if (this.cartId == null) {
      throw new Error("No cart ID found to update lines.")
    }

    const { data, errors, extensions } = await this.client.request(`#graphql
mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
  cartLinesUpdate(cartId: $cartId, lines: $lines) {
    cart {
      id
      checkoutUrl
    }
    userErrors {
      field
      message
    }
  }
}`, { variables: { cartId: this.cartId, lines: [{ id: lineId, quantity: qty }] } })

    if (errors != null) {
      this.errorsThrow(errors)
    }

    return data.cartLinesUpdate.cart
  }

  public async cartLinesAdjust(lineId: string, adjustment: number): Promise<Checkout> {
    if (this.cartId == null) {
      throw new Error("No cart ID found to adjust lines.")
    }

    // Fetch the current cart lines to get the current quantity for the given line
    const { data, errors } = await this.client.request(`#graphql
query getCart($cartId: ID!) {
  cart(id: $cartId) {
    lines(first: 100) {
      edges {
        node {
          id
          quantity
        }
      }
    }
  }
}`, { variables: { cartId: this.cartId } })

    if (errors != null) {
      this.errorsThrow(errors)
    }

    const line = data.cart.lines.edges.find((edge: any) => edge.node.id === lineId)
    if (!line) {
      throw new Error("Line not found in the cart.")
    }

    const newQty = line.node.quantity + adjustment
    if (newQty < 0) {
      throw new Error("Quantity cannot be negative.")
    }

    // If the quantity becomes 0, we can either remove the line or just update it to 0
    const mutationName = newQty === 0 ? 'cartLinesRemove' : 'cartLinesUpdate'
    const variables = newQty === 0 ?
      { cartId: this.cartId, lineIds: [lineId] } :
      { cartId: this.cartId, lines: [{ id: lineId, quantity: newQty }] }

    const mutation = newQty === 0 ?
      `mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
        cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
          cart {
            id
            checkoutUrl
          }
          userErrors {
            field
            message
          }
        }
      }` :
      `mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
        cartLinesUpdate(cartId: $cartId, lines: $lines) {
          cart {
            id
            checkoutUrl
          }
          userErrors {
            field
            message
          }
        }
      }`

    const response = await this.client.request(mutation, { variables })

    if (response.errors) {
      this.errorsThrow(response.errors)
    }

    return newQty === 0 ? response.data.cartLinesRemove.cart : response.data.cartLinesUpdate.cart
  }


}

