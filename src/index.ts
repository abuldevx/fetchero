import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { buildQuery } from '@getanwar/graphql-query-builder';
import { makeErrorResponse, errorCompose } from './utils/errorHandler';
import {
  FetcheroOptions,
  FetcherResponse,
  GraphQLArgs,
  GraphQLOperationProxy,
  GraphQLProxy,
  GraphQLQueryBuilder,
  GraphQLResponse,
  HttpMethod,
  OperationType,
  ProxyContext,
  RestProxy,
  RestRequestOptions,
} from './types';

// ================== ENHANCED FETCHERO CLASS ==================

export class Fetchero {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly interceptors?: FetcheroOptions['interceptors'];

  constructor({ baseUrl, headers = {}, interceptors }: FetcheroOptions) {
    if (!baseUrl || typeof baseUrl !== 'string') {
      throw new Error('Fetchero: "baseUrl" must be a non-empty string.');
    }
    this.baseUrl = baseUrl;
    this.headers = headers;
    this.interceptors = interceptors;
  }

  // ================== REST PROXY IMPLEMENTATION ==================

  public get rest(): RestProxy {
    return this.createRestProxy();
  }

  private createRestProxy(
    segments: string[] = [],
    ctx: ProxyContext = {}
  ): RestProxy {
    const proxyTarget = () => {};

    return new Proxy((proxyTarget as unknown) as RestProxy, {
      get: (_, prop: string | symbol): unknown => {
        if (typeof prop !== 'string') return undefined;

        if (prop === 'base') {
          return (newBase: string) =>
            this.createRestProxy(segments, { ...ctx, base: newBase });
        }

        if (prop === 'headers') {
          return (newHeaders: Record<string, string>) =>
            this.createRestProxy(segments, {
              ...ctx,
              headers: { ...ctx.headers, ...newHeaders },
            });
        }

        // Handle HTTP methods
        if (this.isHttpMethod(prop)) {
          return async (options: RestRequestOptions = {}) =>
            this.makeRequest({
              url: this.buildUrl(
                ctx.base ?? this.baseUrl,
                segments,
                options.query
              ),
              method: prop.toUpperCase() as HttpMethod,
              data: options.body,
              headers: {
                ...this.headers,
                ...ctx.headers,
                ...options.headers,
              },
            });
        }

        return this.createRestProxy([...segments, prop], ctx);
      },
      apply: (_, __, args) => {
        return this.createRestProxy([...segments, ...args.map(String)], ctx);
      },
    });
  }

  /**
   * Type guard for HTTP methods
   */
  private isHttpMethod(method: string) {
    return ['get', 'post', 'put', 'patch', 'delete'].includes(
      method.toLowerCase()
    );
  }

  /**
   * Builds URL with query parameters
   */
  private buildUrl(
    base: string,
    segments: string[],
    query?: Record<string, string | number | boolean>
  ): string {
    const url = new URL(segments.join('/'), base);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.append(key, String(value));
      }
    }

    return url.toString();
  }

  // ================== GRAPHQL PROXY IMPLEMENTATION ==================

  public get gql(): GraphQLProxy {
    return this.createGraphQLProxy({});
  }

  private createGraphQLProxy(ctx: ProxyContext): GraphQLProxy {
    return new Proxy({} as GraphQLProxy, {
      get: (_, operation: string | symbol): unknown => {
        if (typeof operation !== 'string') return undefined;

        const operationType = operation.toLowerCase() as OperationType;
        if (!this.isValidGraphQLOperation(operationType)) {
          throw new Error(`Invalid GraphQL operation "${operation}".`);
        }

        return this.createOperationProxy(operationType, ctx);
      },
    });
  }

  private isValidGraphQLOperation(
    operation: string
  ): operation is OperationType {
    return ['query', 'mutation', 'subscription'].includes(operation);
  }

  private createOperationProxy(
    operation: OperationType,
    ctx: ProxyContext
  ): GraphQLOperationProxy {
    const proxyTarget = () => {};
    return new Proxy((proxyTarget as unknown) as GraphQLOperationProxy, {
      get: (_, field: string | symbol): unknown => {
        if (typeof field !== 'string') return undefined;

        return this.createQueryBuilder(operation, field, {}, ctx);
      },
    });
  }

  private createQueryBuilder(
    operation: OperationType,
    field: string,
    argsObj: GraphQLArgs,
    ctx: ProxyContext
  ): GraphQLQueryBuilder {
    const buildOperation = (selectedFields = 'id') =>
      this.buildGraphQLOperation(operation, field, argsObj, selectedFields);

    const built = buildOperation();
    const fn = () => {};
    return new Proxy((fn as unknown) as GraphQLQueryBuilder, {
      get: (_, prop: string | symbol): unknown => {
        if (typeof prop !== 'string') return undefined;

        // Field selection methods
        if (prop === 'select') {
          return (selectedFields: string) => {
            const rebuilt = buildOperation(selectedFields);
            return this.executeGraphQLQuery(
              rebuilt.query,
              rebuilt.variables,
              ctx
            );
          };
        }

        // Execute method
        if (prop === 'execute') {
          return () =>
            this.executeGraphQLQuery(built.query, built.variables, ctx);
        }

        // await
        if (prop === 'then') {
          return () =>
            this.executeGraphQLQuery(built.query, built.variables, ctx);
        }

        // Configuration methods
        if (prop === 'base') {
          return (newBase: string) =>
            this.createQueryBuilder(operation, field, argsObj, {
              ...ctx,
              base: newBase,
            });
        }

        if (prop === 'headers') {
          return (newHeaders: Record<string, string>) =>
            this.createQueryBuilder(operation, field, argsObj, {
              ...ctx,
              headers: { ...ctx.headers, ...newHeaders },
            });
        }

        throw new Error(
          `Invalid property "${prop}". Use select(fields), execute(), base(url), or headers(obj).`
        );
      },
      apply: (_, __, [argsObj]) => {
        console.log({ argsObj });
        return this.createQueryBuilder(operation, field, argsObj, ctx);
      },
    });
  }

  /**
   * Builds GraphQL operation with improved error handling
   */
  private buildGraphQLOperation(
    operation: OperationType,
    field: string,
    argsObj: GraphQLArgs,
    selection?: string
  ): { query: string; variables: Record<string, unknown> } {
    try {
      const cleanedSelection = selection?.trim() || '';
      const hasArgs = Object.keys(argsObj).length > 0;
      let templateParts: string[] = [];

      if (hasArgs) {
        templateParts = [
          `${operation} { ${field} (`,
          `) { ${cleanedSelection} } }`,
        ];
      } else {
        templateParts = [
          `${operation} { ${field} `,
          ` { ${cleanedSelection} } }`,
        ];
      }

      return buildQuery(templateParts, argsObj);
    } catch (error) {
      throw new Error(
        `Failed to build GraphQL ${operation}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Executes GraphQL query with enhanced error handling
   */
  private async executeGraphQLQuery(
    query: string,
    variables: Record<string, unknown>,
    ctx: ProxyContext
  ): Promise<GraphQLResponse> {
    return this.makeRequest({
      url: ctx.base ?? this.baseUrl,
      method: 'POST',
      data: { query, variables },
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
        ...ctx.headers,
      },
    });
  }

  // ================== CORE HTTP CLIENT ==================

  private async makeRequest<T = unknown>(
    config: AxiosRequestConfig
  ): Promise<FetcherResponse<T>> {
    try {
      // Apply request interceptor if configured
      const finalConfig = this.interceptors?.request
        ? await this.interceptors.request(config)
        : config;

      // Execute request
      const result: AxiosResponse<{ data: T; errors?: any[] }> = await axios(
        finalConfig
      );
      const { data: responseData, errors } = result.data || {};

      // Build response object
      const response: FetcherResponse<T> = {
        data: responseData ?? null,
      };

      // Handle GraphQL errors
      if (errors && Array.isArray(errors) && errors.length > 0) {
        response.errors = [errorCompose(errors[0])];
      }

      // Apply response interceptor if configured
      return this.interceptors?.response
        ? await this.interceptors.response(result)
        : response;
    } catch (err) {
      return this.handleRequestError(err);
    }
  }

  private handleRequestError<T = unknown>(err: unknown): FetcherResponse<T> {
    const error = err as AxiosError<{ message?: string; error?: string }>;

    const status = error.response?.status ?? 500;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Network request failed';

    return {
      data: null,
      errors: [makeErrorResponse({ code: status, message })],
    };
  }
}

// ================== FACTORY FUNCTIONS & EXPORTS ==================

export const createFetchero = (options: FetcheroOptions) => {
  const instance = new Fetchero(options);
  return {
    rest: instance.rest,
    gql: instance.gql,
  } as const;
};

export const rest = (options: FetcheroOptions): RestProxy =>
  new Fetchero(options).rest;

export const gql = (options: FetcheroOptions): GraphQLProxy =>
  new Fetchero(options).gql;
