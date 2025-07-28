import { HttpClient } from '../../../src/core';
import { GraphQLProxyFactory } from '../../../src/proxies';
import { buildQuery } from '../../../src/utils/build-query';

jest.mock('../../../src/utils/build-query');
const mockBuildQuery = buildQuery as jest.MockedFunction<typeof buildQuery>;

describe('GraphQLProxyFactory', () => {
  let factory: GraphQLProxyFactory;
  let mockHttpClient: jest.Mocked<HttpClient>;
  const baseUrl = 'https://api.example.com/graphql';
  const headers = { 'Content-Type': 'application/json' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockHttpClient = {
      makeRequest: jest.fn(),
    } as any;
    factory = new GraphQLProxyFactory(mockHttpClient, baseUrl, headers);

    mockBuildQuery.mockReturnValue({
      query: 'query { user { id } }',
      variables: {},
    });
  });

  describe('createProxy', () => {
    it('should create GraphQL proxy', () => {
      const proxy = factory.createProxy({});
      expect(proxy).toBeDefined();
      expect(proxy.query).toBeDefined();
      expect(proxy.mutation).toBeDefined();
      expect(proxy.subscription).toBeDefined();
    });

    // it('should handle invalid operations', () => {
    //   const proxy = factory.createProxy({});
    //   expect(() => proxy.invalidOperation).toThrow(
    //     'Invalid GraphQL operation "invalidOperation". Valid operations: query, mutation, subscription'
    //   );
    // });

    // it('should handle symbol properties', () => {
    //   const proxy = factory.createProxy({});
    //   const symbolProp = Symbol('test');
    //   expect(proxy[symbolProp]).toBeUndefined();
    // });

    describe('Query operations', () => {
      beforeEach(() => {
        mockHttpClient.makeRequest.mockResolvedValue({
          data: { user: { id: '1', name: 'John' } },
        });
      });

      it('should create query builder', () => {
        const proxy = factory.createProxy({});
        const queryBuilder = proxy.query.user;
        expect(queryBuilder).toBeDefined();
        expect(typeof queryBuilder).toBe('function');
      });

      it('should handle field selection', async () => {
        mockBuildQuery.mockReturnValue({
          query: 'query { user { id name email } }',
          variables: {},
        });

        const proxy = factory.createProxy({});
        await proxy.query.user.select('id name email');

        expect(mockBuildQuery).toHaveBeenCalledWith(
          ['query { user ', ' { id name email } }'],
          {}
        );
        expect(mockHttpClient.makeRequest).toHaveBeenCalledWith({
          url: baseUrl,
          method: 'POST',
          data: {
            query: 'query { user { id name email } }',
            variables: {},
          },
          headers,
        });
      });

      it('should validate field selection', () => {
        const proxy = factory.createProxy({});
        expect(() => proxy.query.user.select('')).toThrow(
          'Field selection must be a non-empty string'
        );
        expect(() => proxy.query.user.select('   ')).toThrow(
          'Field selection must be a non-empty string'
        );
      });

      it('should handle execute method', async () => {
        const proxy = factory.createProxy({});
        await proxy.query.user.execute();

        expect(mockBuildQuery).toHaveBeenCalledWith(
          ['query { user ', '  }'],
          {}
        );
        expect(mockHttpClient.makeRequest).toHaveBeenCalled();
      });

      //   it('should handle then method (Promise-like)', async () => {
      //     const proxy = factory.createProxy({});
      //     const resolveFn = jest.fn();
      //     const rejectFn = jest.fn();

      //     await proxy.query.user.then(resolveFn, rejectFn);

      //     expect(resolveFn).toHaveBeenCalledWith({
      //       data: { user: { id: '1', name: 'John' } },
      //     });
      //     expect(rejectFn).not.toHaveBeenCalled();
      //   });

      it('should handle base URL configuration', async () => {
        const proxy = factory.createProxy({});
        const reconfiguredBuilder = proxy.query.user.base(
          'https://api2.example.com/graphql'
        );

        await reconfiguredBuilder.execute();

        expect(mockHttpClient.makeRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'https://api2.example.com/graphql',
          })
        );
      });

      it('should validate base URL', () => {
        const proxy = factory.createProxy({});
        expect(() => proxy.query.user.base('invalid-url')).toThrow(
          'Invalid URL format: invalid-url'
        );
      });

      it('should handle headers configuration', async () => {
        const proxy = factory.createProxy({});
        const reconfiguredBuilder = proxy.query.user.headers({
          Authorization: 'Bearer token',
        });

        await reconfiguredBuilder.execute();

        expect(mockHttpClient.makeRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            headers: {
              'Content-Type': 'application/json',
              Authorization: 'Bearer token',
            },
          })
        );
      });

      it('should validate headers', () => {
        const proxy = factory.createProxy({});
        expect(() => proxy.query.user.headers(null as any)).toThrow(
          'Headers must be a valid object'
        );
      });

      it('should handle arguments', async () => {
        const proxy = factory.createProxy({});
        const queryBuilder = proxy.query.user({ id: 123 });
        await queryBuilder.select('id');

        expect(mockBuildQuery).toHaveBeenCalledWith(
          ['query { user (', ') { id } }'],
          { id: 123 }
        );
      });

      it('should handle complex arguments', async () => {
        const proxy = factory.createProxy({});
        const args = {
          id: { type: 'ID!', value: '123' },
          name: 'John',
          active: true,
        };
        const queryBuilder = proxy.query.user(args);
        await queryBuilder.select('id');

        expect(mockBuildQuery).toHaveBeenCalledWith(
          ['query { user (', ') { id } }'],
          args
        );
      });

      //   it('should validate GraphQL arguments', () => {
      //     const proxy = factory.createProxy({});
      //     expect(() => proxy.query.user('invalid')).toThrow(
      //       'GraphQL arguments must be an object'
      //     );
      //   });

      it('should handle no arguments', async () => {
        const proxy = factory.createProxy({});
        await proxy.query.user.execute();

        expect(mockBuildQuery).toHaveBeenCalledWith(
          ['query { user ', '  }'],
          {}
        );
      });

      it('should handle context headers', async () => {
        const proxy = factory.createProxy({
          headers: { 'X-Custom': 'value' },
        });
        await proxy.query.user.execute();

        expect(mockHttpClient.makeRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            headers: {
              'Content-Type': 'application/json',
              'X-Custom': 'value',
            },
          })
        );
      });

      it('should handle context base URL', async () => {
        const proxy = factory.createProxy({
          base: 'https://api2.example.com/graphql',
        });
        await proxy.query.user.execute();

        expect(mockHttpClient.makeRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'https://api2.example.com/graphql',
          })
        );
      });

      it('should handle invalid properties', () => {
        const proxy = factory.createProxy({});
        expect(() => proxy.query.user.invalidProperty).toThrow(
          'Invalid property "invalidProperty". Available methods: select(fields), execute(), base(url), headers(obj)'
        );
      });

      //   it('should handle symbol properties in query builder', () => {
      //     const proxy = factory.createProxy({});
      //     const symbolProp = Symbol('test');
      //     expect(() => proxy.query.user[symbolProp]).toThrow();
      //   });
    });

    describe('Mutation operations', () => {
      it('should handle mutations', async () => {
        mockHttpClient.makeRequest.mockResolvedValue({
          data: { createUser: { id: '1' } },
        });

        const proxy = factory.createProxy({});
        await proxy.mutation.createUser({ name: 'John' }).select('id');

        expect(mockBuildQuery).toHaveBeenCalledWith(
          ['mutation { createUser (', ') { id } }'],
          { name: 'John' }
        );
      });
    });

    describe('Subscription operations', () => {
      it('should handle subscriptions', async () => {
        mockHttpClient.makeRequest.mockResolvedValue({
          data: { userUpdated: { id: '1' } },
        });

        const proxy = factory.createProxy({});
        await proxy.subscription.userUpdated.execute();

        expect(mockBuildQuery).toHaveBeenCalledWith(
          ['subscription { userUpdated ', '  }'],
          {}
        );
      });
    });

    describe('Query building', () => {
      it('should handle build failures', () => {
        mockBuildQuery.mockImplementation(() => {
          throw new Error('Build failed');
        });

        const proxy = factory.createProxy({});
        expect(() => proxy.query.user.execute()).toThrow(
          'Failed to build GraphQL query for field "user": Build failed'
        );
      });

      it('should handle invalid query result', () => {
        mockBuildQuery.mockReturnValue({
          query: null as any,
          variables: {},
        });

        const proxy = factory.createProxy({});
        expect(() => proxy.query.user.execute()).toThrow(
          'Failed to generate valid GraphQL query'
        );
      });

      it('should handle missing query in result', () => {
        mockBuildQuery.mockReturnValue({
          variables: {},
        } as any);

        const proxy = factory.createProxy({});
        expect(() => proxy.query.user.execute()).toThrow(
          'Failed to generate valid GraphQL query'
        );
      });
    });

    describe('Query execution', () => {
      it('should validate query string', async () => {
        const proxy = factory.createProxy({});

        // Directly test the private method through reflection or by inducing the error
        await expect(async () => {
          // Force the execution with invalid query
          mockBuildQuery.mockReturnValue({
            query: '',
            variables: {},
          });
          await proxy.query.user.execute();
        }).rejects.toThrow('Failed to generate valid GraphQL query');
      });

      it('should handle null variables', async () => {
        mockBuildQuery.mockReturnValue({
          query: 'query { user { id } }',
          variables: null as any,
        });

        const proxy = factory.createProxy({});
        await proxy.query.user.execute();

        expect(mockHttpClient.makeRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            data: {
              query: 'query { user { id } }',
              variables: {},
            },
          })
        );
      });
    });
  });
});
