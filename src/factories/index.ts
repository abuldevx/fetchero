import { Fetchero } from '../core';
import { FetcheroOptions, RestProxy, GraphQLProxy } from '../types';

/**
 * Creates a Fetchero instance with both REST and GraphQL interfaces
 */
export const createFetchero = (options: FetcheroOptions) => {
  const instance = new Fetchero(options);
  return Object.freeze({
    rest: instance.rest,
    gql: instance.gql,
  });
};

/**
 * Creates a standalone REST client
 */
export const rest = (options: FetcheroOptions): RestProxy =>
  new Fetchero(options).rest;

/**
 * Creates a standalone GraphQL client
 */
export const gql = (options: FetcheroOptions): GraphQLProxy =>
  new Fetchero(options).gql;
