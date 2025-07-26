export { Fetchero } from './core';
export { createFetchero, rest, gql } from './factories';

// Export types for external use
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