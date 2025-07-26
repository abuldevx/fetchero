import { FetcherResponse } from './common';

export interface RestRequestOptions {
  query?: Record<string, string | number | boolean>;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface RestEndpoint<T = unknown> {
  get(options?: RestRequestOptions): Promise<FetcherResponse<T>>;
  post(options?: RestRequestOptions): Promise<FetcherResponse<T>>;
  put(options?: RestRequestOptions): Promise<FetcherResponse<T>>;
  patch(options?: RestRequestOptions): Promise<FetcherResponse<T>>;
  delete(options?: RestRequestOptions): Promise<FetcherResponse<T>>;
  base(newBase: string): RestEndpoint<T>;
  headers(newHeaders: Record<string, string>): RestEndpoint<T>;
}

export type RestKeys = keyof RestEndpoint;

export type RestProxy<T = any> = RestEndpoint<T> & {
  (...args: Array<any>): RestProxy<T>;
} & {
    [K in Exclude<string, RestKeys>]: RestProxy<T>;
  };
