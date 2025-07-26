import { createFetchero } from '../../src/index';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const createMockResponse = <T = any>(
  data: T,
  status = 200,
  statusText = 'OK'
) => ({
  data,
  status,
  statusText,
  headers: {},
  config: {},
});

export const createMockError = (
  message: string,
  status?: number,
  data?: any
): AxiosError => {
  const error = new Error(message) as AxiosError;
  error.isAxiosError = true;
  error.name = 'AxiosError';
  error.config = {} as InternalAxiosRequestConfig;

  if (status) {
    error.response = {
      data,
      status,
      statusText: 'Error',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };
  }

  return error;
};

jest.mock('axios', () => ({
  __esModule: true,
  default: jest.fn(async () => {}),
}));

const mockAxiosFunction = axios as jest.MockedFunction<typeof axios>;

describe('Additional Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Proxy edge cases', () => {
    it('should handle numeric properties correctly', () => {
      const fetchero = createFetchero({ baseUrl: 'https://api.example.com' });

      // Access with numeric property
      const proxy = fetchero.rest[123];
      expect(proxy).toBeDefined();
      expect(typeof proxy).toBe('function');
    });

    it('should handle empty string properties', () => {
      const fetchero = createFetchero({ baseUrl: 'https://api.example.com' });

      const proxy = fetchero.rest[''];
      expect(proxy).toBeDefined();
    });

    it('should handle special characters in property names', () => {
      const fetchero = createFetchero({ baseUrl: 'https://api.example.com' });

      const proxy = fetchero.rest['user-profile'];
      expect(proxy).toBeDefined();
    });

    it('should handle apply trap with empty arguments', () => {
      const fetchero = createFetchero({ baseUrl: 'https://api.example.com' });

      const proxy = fetchero.rest();
      expect(proxy).toBeDefined();
    });

    it('should handle apply trap with mixed argument types', () => {
      const fetchero = createFetchero({ baseUrl: 'https://api.example.com' });

      const proxy = fetchero.rest('users', 123, true, null, undefined, 'posts');
      expect(proxy).toBeDefined();
    });
  });

  describe('HTTP method edge cases', () => {
    it('should handle method names with different casing', () => {
      const fetchero = createFetchero({ baseUrl: 'https://api.example.com' });

      // These should work (lowercase)
      expect(typeof fetchero.rest.users.get).toBe('function');
      expect(typeof fetchero.rest.users.post).toBe('function');

      // These should not be HTTP methods (uppercase)
      expect(typeof fetchero.rest.users.GET).toBe('function'); // Should be treated as path segment
      expect(fetchero.rest.users.GET).not.toBe(fetchero.rest.users.get);
    });

    it('should handle partial HTTP method names', () => {
      const fetchero = createFetchero({ baseUrl: 'https://api.example.com' });

      // These are not valid HTTP methods, should be treated as path segments
      expect(typeof fetchero.rest.users.ge).toBe('function');
      expect(typeof fetchero.rest.users.pos).toBe('function');
      expect(typeof fetchero.rest.users.getUsers).toBe('function');
    });
  });

  describe('GraphQL edge cases', () => {
    it('should handle numeric properties in GraphQL fields', () => {
      const fetchero = createFetchero({
        baseUrl: 'https://api.example.com/graphql',
      });

      const queryBuilder = fetchero.gql.query[123];
      expect(queryBuilder).toBeDefined();
    });

    it('should handle empty field names', () => {
      const fetchero = createFetchero({
        baseUrl: 'https://api.example.com/graphql',
      });

      expect(() => fetchero.gql.query['']).toThrow(
        'Field name must be a non-empty string'
      );
    });
  });

  describe('URL building edge cases', () => {
    it.skip('should handle URLs with existing query parameters', async () => {
      const fetchero = createFetchero({ baseUrl: 'https://api.example.com' });

      mockAxiosFunction.mockResolvedValue(createMockResponse({ data: {} }));

      await fetchero.rest.users
        .base('https://api.example.com?existing=param')
        .get({
          query: { new: 'param' },
        });

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('existing=param'),
        })
      );
    });

    it('should handle URLs with fragments', async () => {
      const fetchero = createFetchero({
        baseUrl: 'https://api.example.com#fragment',
      });

      mockAxiosFunction.mockResolvedValue(createMockResponse({ data: {} }));

      await fetchero.rest.users.get();

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('api.example.com'),
        })
      );
    });

    it('should handle international domain names', async () => {
      const fetchero = createFetchero({
        baseUrl: 'https://münchen.example.com',
      });

      mockAxiosFunction.mockResolvedValue(createMockResponse({ data: {} }));

      await fetchero.rest.users.get();

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('xn--'),
        })
      );
    });
  });

  describe('Headers edge cases', () => {
    it('should handle headers with special characters', async () => {
      const fetchero = createFetchero({
        baseUrl: 'https://api.example.com',
        headers: { 'X-Custom-Header': 'value with spaces and símb0ls' },
      });

      mockAxiosFunction.mockResolvedValue(createMockResponse({ data: {} }));

      await fetchero.rest.users.get();

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'value with spaces and símb0ls',
          }),
        })
      );
    });

    it('should handle empty header values', async () => {
      const fetchero = createFetchero({ baseUrl: 'https://api.example.com' });

      mockAxiosFunction.mockResolvedValue(createMockResponse({ data: {} }));

      await fetchero.rest.users.get({
        headers: { 'X-Empty': '', 'X-Normal': 'value' },
      });

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Empty': '',
            'X-Normal': 'value',
          }),
        })
      );
    });

    it('should handle header overrides correctly', async () => {
      const fetchero = createFetchero({
        baseUrl: 'https://api.example.com',
        headers: { 'Content-Type': 'application/json' },
      });

      mockAxiosFunction.mockResolvedValue(createMockResponse({ data: {} }));

      await fetchero.rest.users
        .headers({ 'Content-Type': 'application/xml' })
        .get({
          headers: { 'Content-Type': 'text/plain' },
        });

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'text/plain', // Last one wins
          }),
        })
      );
    });
  });

  describe('Request body edge cases', () => {
    it('should handle null request body', async () => {
      const fetchero = createFetchero({ baseUrl: 'https://api.example.com' });

      mockAxiosFunction.mockResolvedValue(createMockResponse({ data: {} }));

      await fetchero.rest.users.post({ body: null });

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          data: null,
        })
      );
    });

    it('should handle undefined request body', async () => {
      const fetchero = createFetchero({ baseUrl: 'https://api.example.com' });

      mockAxiosFunction.mockResolvedValue(createMockResponse({ data: {} }));

      await fetchero.rest.users.post({ body: undefined });

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          data: undefined,
        })
      );
    });

    it('should handle complex nested objects', async () => {
      const fetchero = createFetchero({ baseUrl: 'https://api.example.com' });

      mockAxiosFunction.mockResolvedValue(createMockResponse({ data: {} }));

      const complexObject = {
        user: {
          name: 'John',
          details: {
            age: 30,
            preferences: ['coding', 'reading'],
            metadata: {
              created: new Date(),
              tags: null,
            },
          },
        },
      };

      await fetchero.rest.users.post({ body: complexObject });

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          data: complexObject,
        })
      );
    });
  });

  describe('Configuration chaining edge cases', () => {
    it('should handle multiple base URL changes', async () => {
      const fetchero = createFetchero({ baseUrl: 'https://api.example.com' });

      mockAxiosFunction.mockResolvedValue(createMockResponse({ data: {} }));

      await fetchero.rest.users
        .base('https://api2.example.com')
        .base('https://api3.example.com')
        .get();

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api3.example.com/users', // Last base URL wins
        })
      );
    });

    it('should handle multiple header configurations', async () => {
      const fetchero = createFetchero({ baseUrl: 'https://api.example.com' });

      mockAxiosFunction.mockResolvedValue(createMockResponse({ data: {} }));

      await fetchero.rest.users
        .headers({ 'X-First': '1', 'X-Common': 'original' })
        .headers({ 'X-Second': '2', 'X-Common': 'updated' })
        .get();

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-First': '1',
            'X-Second': '2',
            'X-Common': 'updated', // Should be merged and last value wins
          }),
        })
      );
    });

    it('should handle mixed configuration and path building', async () => {
      const fetchero = createFetchero({ baseUrl: 'https://api.example.com' });

      mockAxiosFunction.mockResolvedValue(createMockResponse({ data: {} }));

      const result = fetchero.rest.api.v1
        .users(123)
        .posts.headers({ 'X-Resource': 'posts' })
        .base('https://api2.example.com')
        .headers({ 'X-Version': 'v1' });

      await result.get();

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api2.example.com/api/v1/users/123/posts',
          headers: expect.objectContaining({
            'X-Version': 'v1',
            'X-Resource': 'posts',
          }),
        })
      );
    });
  });

  describe('Promise integration edge cases', () => {
    // it('should handle promise rejection in then method', async () => {
    //   const fetchero = createFetchero({
    //     baseUrl: 'https://api.example.com/graphql',
    //   });

    //   mockAxiosFunction.mockRejectedValue(new Error('Network error'));

    //   const rejectFn = jest.fn();

    //   await fetchero.gql.query.user.then(() => {}, rejectFn);

    //   expect(rejectFn).toHaveBeenCalled();
    // });

    it('should handle async/await with GraphQL queries', async () => {
      const fetchero = createFetchero({
        baseUrl: 'https://api.example.com/graphql',
      });

      mockAxiosFunction.mockResolvedValue(
        createMockResponse({
          data: { user: { id: '1' } },
        })
      );

      // Direct await on query builder (using implicit then)
      const result = await fetchero.gql.query.user;

      expect(result.data).toEqual({ user: { id: '1' } });
    });
  });

  describe('Error propagation edge cases', () => {
    it('should handle errors in request interceptor', async () => {
      const requestInterceptor = jest.fn(() => {
        throw new Error('Interceptor error');
      });

      const fetchero = createFetchero({
        baseUrl: 'https://api.example.com',
        interceptors: { request: requestInterceptor },
      });

      const result = await fetchero.rest.users.get();

      expect(result.data).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].extensions.message).toBe('Interceptor error');
    });

    it('should handle async errors in interceptors', async () => {
      const requestInterceptor = jest.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        throw new Error('Async interceptor error');
      });

      const fetchero = createFetchero({
        baseUrl: 'https://api.example.com',
        interceptors: { request: requestInterceptor },
      });

      const result = await fetchero.rest.users.get();

      expect(result.errors![0].extensions.message).toBe(
        'Async interceptor error'
      );
    });
  });

  describe('Memory and performance edge cases', () => {
    it('should not leak memory with many proxy creations', () => {
      const fetchero = createFetchero({ baseUrl: 'https://api.example.com' });

      // Create many proxies to test for memory leaks
      for (let i = 0; i < 10000; i++) {
        const proxy = fetchero.rest.users(i);
        expect(proxy).toBeDefined();
      }

      // If we get here without running out of memory, test passes
      expect(true).toBe(true);
    });

    it('should handle deeply nested proxy chains', () => {
      const fetchero = createFetchero({ baseUrl: 'https://api.example.com' });

      // Create a very deep chain
      let proxy = fetchero.rest;
      for (let i = 0; i < 100; i++) {
        proxy = proxy[`level${i}`];
      }

      expect(proxy).toBeDefined();
      expect(typeof proxy.get).toBe('function');
    });
  });
});
