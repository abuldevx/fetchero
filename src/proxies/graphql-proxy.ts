import {
  GraphQLProxy,
  GraphQLOperationProxy,
  GraphQLQueryBuilder,
  GraphQLArgs,
  OperationType,
  ProxyContext,
  GraphQLResponse,
} from '../types';
import { Validators } from '../utils';
import { HttpClient } from '../core/http-client';
import { buildQuery } from '../utils/build-query';

/**
 * GraphQL proxy implementation with enhanced error handling
 */
export class GraphQLProxyFactory {
  private static readonly GRAPHQL_OPERATIONS = new Set([
    'query',
    'mutation',
    'subscription',
  ]);

  constructor(
    private httpClient: HttpClient,
    private baseUrl: string,
    private headers: Record<string, string>
  ) {}

  /**
   * Creates GraphQL proxy
   */
  createProxy(ctx: ProxyContext): GraphQLProxy {
    return new Proxy({} as GraphQLProxy, {
      get: (_, operation: string | symbol): unknown => {
        if (typeof operation !== 'string') return undefined;

        const operationType = operation.toLowerCase() as OperationType;
        if (!this.isValidGraphQLOperation(operationType)) {
          throw new Error(
            `Invalid GraphQL operation "${operation}". Valid operations: query, mutation, subscription`
          );
        }
        try {
          return this.createOperationProxy(operationType, ctx);
        } catch (error) {
          console.log({ error }, 'abul boom');
          return error;
        }
      },
    });
  }

  /**
   * Optimized GraphQL operation validation
   */
  private isValidGraphQLOperation(
    operation: string
  ): operation is OperationType {
    return GraphQLProxyFactory.GRAPHQL_OPERATIONS.has(operation);
  }

  /**
   * Creates operation-specific proxy
   */
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

  /**
   * Creates GraphQL query builder with improved caching
   */
  private createQueryBuilder(
    operation: OperationType,
    field: string,
    argsObj: GraphQLArgs,
    ctx: ProxyContext
  ): GraphQLQueryBuilder {
    // Memoize operation building for performance
    const buildOperation = (selectedFields = '') => {
      return this.buildGraphQLOperation(
        operation,
        field,
        argsObj,
        selectedFields
      );
    };

    const built = buildOperation();
    const fn = () => {};

    return new Proxy((fn as unknown) as GraphQLQueryBuilder, {
      get: (_, prop: string | symbol): unknown => {
        if (typeof prop !== 'string') return undefined;

        switch (prop) {
          case 'select':
            return (selectedFields: string) => {
              Validators.validateFields(selectedFields);
              const rebuilt = buildOperation(selectedFields);
              return this.executeGraphQLQuery(
                rebuilt.query,
                rebuilt.variables,
                ctx
              );
            };

          case 'execute':
            return () =>
              this.executeGraphQLQuery(built.query, built.variables, ctx);

          case 'then':
            return (
              resolve: (value: any) => any,
              reject?: (reason?: any) => any
            ) => {
              return this.executeGraphQLQuery(
                built.query,
                built.variables,
                ctx
              ).then(resolve, reject);
            };

          case 'base':
            return (newBase: string) => {
              Validators.validateUrl(newBase);
              return this.createQueryBuilder(operation, field, argsObj, {
                ...ctx,
                base: newBase,
              });
            };

          case 'headers':
            return (newHeaders: Record<string, string>) => {
              Validators.validateHeaders(newHeaders);
              return this.createQueryBuilder(operation, field, argsObj, {
                ...ctx,
                headers: { ...ctx.headers, ...newHeaders },
              });
            };

          default:
            throw new Error(
              `Invalid property "${prop}". Available methods: select(fields), execute(), base(url), headers(obj)`
            );
        }
      },

      apply: (_, __, [argsObj]) => {
        Validators.validateGraphQLArgs(argsObj);
        return this.createQueryBuilder(operation, field, argsObj || {}, ctx);
      },
    });
  }

  /**
   * Builds GraphQL operation with enhanced error handling and validation
   */
  private buildGraphQLOperation(
    operation: OperationType,
    field: string,
    argsObj: GraphQLArgs,
    selection?: string
  ): { query: string; variables: Record<string, unknown> } {
    try {
      // Validate inputs
      if (!field || typeof field !== 'string') {
        throw new Error('Field name must be a non-empty string');
      }

      const cleanedSelection = selection?.trim();
      const hasArgs = argsObj && Object.keys(argsObj).length > 0;

      const select = cleanedSelection ? `{ ${cleanedSelection} }` : '';

      const templateParts = hasArgs
        ? [`${operation} { ${field} (`, `) ${select} }`]
        : [`${operation} { ${field} `, ` ${select} }`];

      const result = buildQuery(templateParts, argsObj || {});

      // Validate the built query
      if (!result.query || typeof result.query !== 'string') {
        throw new Error('Failed to generate valid GraphQL query');
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to build GraphQL ${operation} for field "${field}": ${message}`
      );
    }
  }

  /**
   * Executes GraphQL query with comprehensive error handling
   */
  private async executeGraphQLQuery(
    query: string,
    variables: Record<string, unknown>,
    ctx: ProxyContext
  ): Promise<GraphQLResponse> {
    if (!query || typeof query !== 'string') {
      throw new Error('GraphQL query must be a non-empty string');
    }

    return this.httpClient.makeRequest({
      url: ctx.base ?? this.baseUrl,
      method: 'POST',
      data: { query, variables: variables || {} },
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
        ...ctx.headers,
      },
    });
  }
}
