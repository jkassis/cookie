/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import * as StorefrontTypes from './storefront.types.d.ts';

export type ProductsGetNQueryVariables = StorefrontTypes.Exact<{
  n: StorefrontTypes.Scalars['Int']['input'];
}>;


export type ProductsGetNQuery = { products: { edges: Array<{ node: (
        Pick<StorefrontTypes.Product, 'id' | 'title' | 'handle' | 'description'>
        & { variants: { edges: Array<{ node: Pick<StorefrontTypes.ProductVariant, 'id'> }> }, images: { edges: Array<{ node: Pick<StorefrontTypes.Image, 'src' | 'altText'> }> } }
      ) }> } };

export type CartGetQueryVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars['ID']['input'];
}>;


export type CartGetQuery = { cart?: StorefrontTypes.Maybe<(
    Pick<StorefrontTypes.Cart, 'id' | 'checkoutUrl' | 'totalQuantity'>
    & { cost: (
      Pick<StorefrontTypes.CartCost, 'subtotalAmountEstimated' | 'totalAmountEstimated' | 'totalDutyAmountEstimated' | 'totalTaxAmountEstimated'>
      & { subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, totalDutyAmount?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>>, totalTaxAmount?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>> }
    ), lines: { edges: Array<{ node: (
          Pick<StorefrontTypes.CartLine, 'id' | 'quantity'>
          & { cost: { amountPerQuantity: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, compareAtAmountPerQuantity?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>>, subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, merchandise: (
            Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
            & { unitPrice?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
              Pick<StorefrontTypes.Product, 'id' | 'title' | 'description'>
              & { images: { edges: Array<{ node: Pick<StorefrontTypes.Image, 'src' | 'altText'> }> } }
            ) }
          ) }
        ) | (
          Pick<StorefrontTypes.ComponentizableCartLine, 'id' | 'quantity'>
          & { cost: { amountPerQuantity: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, compareAtAmountPerQuantity?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>>, subtotalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, totalAmount: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'> }, merchandise: (
            Pick<StorefrontTypes.ProductVariant, 'id' | 'title'>
            & { unitPrice?: StorefrontTypes.Maybe<Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>>, price: Pick<StorefrontTypes.MoneyV2, 'amount' | 'currencyCode'>, product: (
              Pick<StorefrontTypes.Product, 'id' | 'title' | 'description'>
              & { images: { edges: Array<{ node: Pick<StorefrontTypes.Image, 'src' | 'altText'> }> } }
            ) }
          ) }
        ) }> } }
  )> };

export type CartPutMutationVariables = StorefrontTypes.Exact<{
  input: StorefrontTypes.CartInput;
}>;


export type CartPutMutation = { cartCreate?: StorefrontTypes.Maybe<{ cart?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Cart, 'id' | 'checkoutUrl'>>, userErrors: Array<Pick<StorefrontTypes.CartUserError, 'field' | 'message'>> }> };

export type CartLinesAddMutationVariables = StorefrontTypes.Exact<{
  cartId: StorefrontTypes.Scalars['ID']['input'];
  lines: Array<StorefrontTypes.CartLineInput> | StorefrontTypes.CartLineInput;
}>;


export type CartLinesAddMutation = { cartLinesAdd?: StorefrontTypes.Maybe<{ cart?: StorefrontTypes.Maybe<Pick<StorefrontTypes.Cart, 'id' | 'checkoutUrl'>>, userErrors: Array<Pick<StorefrontTypes.CartUserError, 'field' | 'message'>> }> };

interface GeneratedQueryTypes {
  "#graphql\n    query ProductsGetN($n: Int!) {\n      products(first: $n) {\n        edges {\n          node {\n            id\n            variants(first: 1) {\n              edges {\n                node {\n                  id\n                }\n              }\n            }\n            title\n            handle\n            description\n            images(first: 1) {\n              edges {\n                node {\n                  src\n                  altText\n                }\n              }\n            }\n          }\n        }\n      }\n    }": {return: ProductsGetNQuery, variables: ProductsGetNQueryVariables},
  "#graphql\nquery CartGet($cartId: ID!) {\n  cart(id: $cartId) {\n    id\n    checkoutUrl\n    cost {\n      subtotalAmount {\n        amount\n        currencyCode\n      }\n      subtotalAmountEstimated\n      totalAmount {\n        amount\n        currencyCode\n      }\n      totalAmountEstimated\n      totalDutyAmount {\n        amount\n        currencyCode\n      }\n      totalDutyAmountEstimated\n      totalTaxAmount {\n        amount\n        currencyCode\n      }\n      totalTaxAmountEstimated\n    }\n    totalQuantity\n    lines(first: 250) { # Adjust the 'first' parameter as needed, up to Shopify's maximum allowed\n      edges {\n        node {\n          id\n          cost {\n            amountPerQuantity {\n              amount\n              currencyCode\n            }\n            compareAtAmountPerQuantity {\n              amount\n              currencyCode\n            }\n            subtotalAmount {\n              amount\n              currencyCode\n            }\n            totalAmount {\n              amount\n              currencyCode\n            }\n          }\n          quantity\n          merchandise {\n            ... on ProductVariant {\n              id\n              title\n              unitPrice {\n                amount\n                currencyCode\n              }\n              price {\n                amount\n                currencyCode\n              }\n              product {\n                id\n                title\n                description\n                images(first: 1) {\n                  edges {\n                    node {\n                      src\n                      altText\n                    }\n                  }\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n  }\n}": {return: CartGetQuery, variables: CartGetQueryVariables},
}

interface GeneratedMutationTypes {
  "#graphql\nmutation cartPut($input: CartInput!) {\n  cartCreate(input: $input) {\n    cart {\n      id\n      checkoutUrl\n    }\n    userErrors {\n      field\n      message\n    }\n  }\n}": {return: CartPutMutation, variables: CartPutMutationVariables},
  "#graphql\nmutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {\n  cartLinesAdd(cartId: $cartId, lines: $lines) {\n    cart {\n      id\n      checkoutUrl\n    }\n    userErrors {\n      field\n      message\n    }\n  }\n}": {return: CartLinesAddMutation, variables: CartLinesAddMutationVariables},
}
declare module '@shopify/storefront-api-client' {
  type InputMaybe<T> = StorefrontTypes.InputMaybe<T>;
  interface StorefrontQueries extends GeneratedQueryTypes {}
  interface StorefrontMutations extends GeneratedMutationTypes {}
}
