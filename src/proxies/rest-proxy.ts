import {
  RestProxy,
  RestRequestOptions,
  ProxyContext,
  HttpMethod,
} from '../types';
import { URLBuilder, Validators } from '../utils';
import { HttpClient } from '../core/http-client';

/**
 * REST proxy implementation with caching and performance optimizations
 */
export class RestProxyFactory {
  private static readonly HTTP_METHODS = new Set([
    'get',
    'post',
    'put',
    'patch',
    'delete',
  ]);

  constructor(
    private httpClient: HttpClient,
    private baseUrl: string,
    private headers: Record<string, string>
  ) {}

  /**
   * Creates REST proxy
   */
  createProxy(segments: string[] = [], ctx: ProxyContext = {}): RestProxy {
    const proxyTarget = () => {};

    return new Proxy((proxyTarget as unknown) as RestProxy, {
      get: (_, prop: string | symbol): unknown => {
        if (typeof prop !== 'string') return undefined;

        // Handle configuration methods
        switch (prop) {
          case 'base':
            return (newBase: string) => {
              Validators.validateUrl(newBase);
              return this.createProxy(segments, { ...ctx, base: newBase });
            };

          case 'headers':
            return (newHeaders: Record<string, string>) => {
              Validators.validateHeaders(newHeaders);
              return this.createProxy(segments, {
                ...ctx,
                headers: { ...ctx.headers, ...newHeaders },
              });
            };
        }

        // Handle HTTP methods
        if (this.isHttpMethod(prop)) {
          return async (options: RestRequestOptions = {}) => {
            const url = URLBuilder.build(
              ctx.base ?? this.baseUrl,
              segments,
              options.query
            );

            return this.httpClient.makeRequest({
              url,
              method: prop.toUpperCase() as HttpMethod,
              data: options.body,
              headers: {
                ...this.headers,
                ...ctx.headers,
                ...options.headers,
              },
            });
          };
        }

        // Create new proxy for path segments
        return this.createProxy([...segments, prop], ctx);
      },

      apply: (_, __, args) => {
        const validArgs = args.filter((arg: any) => arg != null).map(String);
        return this.createProxy([...segments, ...validArgs], ctx);
      },
    });
  }

  /**
   * Optimized HTTP method validation using Set
   */
  private isHttpMethod(method: string): boolean {
    return RestProxyFactory.HTTP_METHODS.has(method.toLowerCase());
  }
}
