import { AxiosRequestConfig, AxiosResponse } from 'axios';
type IMessage = string | { [key: string]: any };

interface IExtensions {
  code?: string;
  message?: IMessage;
  [key: string]: any;
}

interface IErrors {
  extensions: IExtensions;
  message?: IMessage;
}

interface FetcherResponse<T = any> {
  data: T | null;
  errors?: IErrors[];
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type OperationType = 'query' | 'mutation' | 'subscription';

interface GraphQLResponse<T = unknown> extends FetcherResponse<T> {
  extensions?: Record<string, unknown>;
}

interface FetcheroOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  interceptors?: {
    request?: (
      config: AxiosRequestConfig
    ) => Promise<AxiosRequestConfig> | AxiosRequestConfig;
    response?: <T = unknown>(response: AxiosResponse<T>) => Promise<T> | T;
  };
}

interface GraphQLArgs {
  [key: string]: { type: string; value: unknown } | number | string | boolean;
}

interface RestRequestOptions {
  query?: Record<string, string | number | boolean>;
  body?: unknown;
  headers?: Record<string, string>;
}

interface ProxyContext {
  base?: string;
  headers?: Record<string, string>;
}

interface RestEndpoint<T = unknown> {
  get(options?: RestRequestOptions): Promise<FetcherResponse<T>>;
  post(options?: RestRequestOptions): Promise<FetcherResponse<T>>;
  put(options?: RestRequestOptions): Promise<FetcherResponse<T>>;
  patch(options?: RestRequestOptions): Promise<FetcherResponse<T>>;
  delete(options?: RestRequestOptions): Promise<FetcherResponse<T>>;
  base(newBase: string): RestEndpoint<T>;
  headers(newHeaders: Record<string, string>): RestEndpoint<T>;
}

type RestKeys = keyof RestEndpoint;

type RestProxy<T = any> = RestEndpoint<T> & {
  (...args: Array<string | number>): RestProxy<T>;
} & {
    [K in Exclude<string, RestKeys>]: RestProxy<T>;
  };

interface GraphQLQueryBuilder<T = unknown> {
  select(fields: string): Promise<GraphQLResponse<T>>;
  execute(): Promise<GraphQLResponse<T>>;
  base(newBase: string): GraphQLQueryBuilder<T>;
  headers(newHeaders: Record<string, string>): GraphQLQueryBuilder<T>;
}

type ReservedKeys = keyof GraphQLQueryBuilder;

type GraphQLOperationProxy<T = any> = GraphQLQueryBuilder<T> & {
  (args?: GraphQLArgs): GraphQLOperationProxy<T>;
} & {
    [K in Exclude<string, ReservedKeys>]: GraphQLOperationProxy<T>;
  };

interface GraphQLProxy {
  query: GraphQLOperationProxy;
  mutation: GraphQLOperationProxy;
  subscription: GraphQLOperationProxy;
}

export {
  IErrors,
  IMessage,
  RestProxy,
  HttpMethod,
  GraphQLArgs,
  IExtensions,
  GraphQLProxy,
  ProxyContext,
  OperationType,
  FetcherResponse,
  FetcheroOptions,
  GraphQLResponse,
  RestRequestOptions,
  GraphQLQueryBuilder,
  GraphQLOperationProxy,
};
