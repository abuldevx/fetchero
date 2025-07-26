// import { FetcheroOptions, RestProxy, GraphQLProxy } from '../types';
import { Validators } from '../utils';
import { HttpClient } from './http-client';
import { RestProxyFactory, GraphQLProxyFactory } from '../proxies';
import { FetcheroOptions, GraphQLProxy, RestProxy } from '../types';

/**
 * Enhanced Fetchero class with separated concerns
 */
export class Fetchero {
  private readonly httpClient: HttpClient;
  private readonly restProxyFactory: RestProxyFactory;
  private restProxy?: RestProxy;
  private gqlProxy?: GraphQLProxy;
  private readonly graphqlProxyFactory: GraphQLProxyFactory;
  // private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor({ baseUrl, headers = {}, interceptors }: FetcheroOptions) {
    Validators.validateConstructorArgs(baseUrl);

    // this.baseUrl = baseUrl;
    this.headers = Object.freeze({ ...headers });

    // Initialize HTTP client
    this.httpClient = new HttpClient(baseUrl, this.headers, interceptors);

    // Initialize proxy factories
    this.restProxyFactory = new RestProxyFactory(
      this.httpClient,
      baseUrl,
      this.headers
    );
    this.graphqlProxyFactory = new GraphQLProxyFactory(
      this.httpClient,
      baseUrl,
      this.headers
    );
  }

  /**
   * Returns REST proxy interface
   */
  public get rest(): RestProxy {
    if (!this.restProxy) {
      this.restProxy = this.restProxyFactory.createProxy();
    }
    return this.restProxy;
  }

  /**
   * Returns GraphQL proxy interface
   */
  public get gql(): GraphQLProxy {
    if (!this.gqlProxy) {
      this.gqlProxy = this.graphqlProxyFactory.createProxy({});
    }
    return this.gqlProxy;
  }
}
