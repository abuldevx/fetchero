export { Fetchero } from './core';
export { createFetchero, rest, gql } from './factories';

// eslint-disable-next-line prettier/prettier
export type {
  FetcheroOptions,
  RestProxy,
  GraphQLProxy,
  FetcherResponse,
  GraphQLResponse,
  RestRequestOptions,
  GraphQLArgs,
  HttpMethod,
  OperationType,
} from './types';

// Export utilities for advanced usage
export { ErrorHandler, URLBuilder, Validators } from './utils';