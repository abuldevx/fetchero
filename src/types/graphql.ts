import { FetcherResponse } from './common';

export type OperationType = 'query' | 'mutation' | 'subscription';

export interface GraphQLArgs {
  [key: string]: { type: string; value: unknown } | any;
}

export type GraphQLResponse<T = unknown> = FetcherResponse<T>;

export interface GraphQLQueryBuilder<T = unknown> {
  select(fields: string): Promise<GraphQLResponse<T>>;
  execute(): Promise<GraphQLResponse<T>>;
  base(newBase: string): GraphQLQueryBuilder<T>;
  headers(newHeaders: Record<string, string>): GraphQLQueryBuilder<T>;
}

export type ReservedKeys = keyof GraphQLQueryBuilder;

export type GraphQLOperationProxy<T = any> = GraphQLQueryBuilder<T> & {
  (args?: GraphQLArgs): GraphQLOperationProxy<T>;
} & {
    [K in Exclude<string, ReservedKeys>]: GraphQLOperationProxy<T>;
  };

export interface GraphQLProxy {
  query: GraphQLOperationProxy;
  mutation: GraphQLOperationProxy;
  subscription: GraphQLOperationProxy;
}
