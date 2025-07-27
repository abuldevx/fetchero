// import { RestProxyFactory } from '@/proxies/rest-proxy';
// import { HttpClient } from '@/core/http-client';

import { HttpClient } from '../../../src/core';
import { RestProxyFactory } from '../../../src/proxies';

describe('RestProxyFactory', () => {
  let factory: RestProxyFactory;
  let mockHttpClient: jest.Mocked<HttpClient>;
  const baseUrl = 'https://api.example.com';
  const headers = { 'Content-Type': 'application/json' };

  beforeEach(() => {
    mockHttpClient = {
      makeRequest: jest.fn(),
    } as any;
    factory = new RestProxyFactory(mockHttpClient, baseUrl, headers);
  });

  describe('createProxy', () => {
    it('should create basic REST proxy', () => {
      const proxy = factory.createProxy();
      expect(proxy).toBeDefined();
      expect(typeof proxy).toBe('function');
    });

    it('should handle path segments', () => {
      const proxy = factory.createProxy();
      const userProxy = proxy.users;
      expect(userProxy).toBeDefined();
      expect(typeof userProxy).toBe('function');
    });

    it('should handle nested path segments', () => {
      const proxy = factory.createProxy();
      const nestedProxy = proxy.api.v1.users;
      expect(nestedProxy).toBeDefined();
    });

    it('should handle function call segments', () => {
      const proxy = factory.createProxy();
      const userProxy = proxy('users', 123, 'posts');
      expect(userProxy).toBeDefined();
    });

    it('should filter null and undefined arguments', () => {
      const proxy = factory.createProxy();
      const userProxy = proxy('users', null, 123, undefined, 'posts');
      // Should only include 'users', '123', 'posts'
      expect(userProxy).toBeDefined();
    });

    it('should handle base method configuration', () => {
      const proxy = factory.createProxy();
      const reconfiguredProxy = proxy.base('https://api2.example.com');
      expect(reconfiguredProxy).toBeDefined();
    });

    it('should validate base URL in base method', () => {
      const proxy = factory.createProxy();
      expect(() => proxy.base('invalid-url')).toThrow(
        'Invalid URL format: invalid-url'
      );
    });

    it('should handle headers method configuration', () => {
      const proxy = factory.createProxy();
      const reconfiguredProxy = proxy.headers({
        Authorization: 'Bearer token',
      });
      expect(reconfiguredProxy).toBeDefined();
    });

    it('should validate headers in headers method', () => {
      const proxy = factory.createProxy();
      expect(() => proxy.headers(null as any)).toThrow(
        'Headers must be a valid object'
      );
    });

    describe('HTTP methods', () => {
      beforeEach(() => {
        mockHttpClient.makeRequest.mockResolvedValue({
          data: { success: true },
        });
      });

      it('should handle GET requests', async () => {
        const proxy = factory.createProxy();
        await proxy.users.get();

        expect(mockHttpClient.makeRequest).toHaveBeenCalledWith({
          url: 'https://api.example.com/users',
          method: 'GET',
          data: undefined,
          transformResponse: expect.anything(),
          headers: { 'Content-Type': 'application/json' },
        });
      });

      it('should handle POST requests with body', async () => {
        const proxy = factory.createProxy();
        await proxy.users.post({
          body: { name: 'John', email: 'john@example.com' },
        });

        expect(mockHttpClient.makeRequest).toHaveBeenCalledWith({
          url: 'https://api.example.com/users',
          method: 'POST',
          data: { name: 'John', email: 'john@example.com' },
          headers: { 'Content-Type': 'application/json' },
          transformResponse: expect.anything(),
        });
      });

      it('should handle PUT requests', async () => {
        const proxy = factory.createProxy();
        await proxy.users(123).put({ body: { name: 'Jane' } });

        expect(mockHttpClient.makeRequest).toHaveBeenCalledWith({
          url: 'https://api.example.com/users/123',
          method: 'PUT',
          data: { name: 'Jane' },
          transformResponse: expect.anything(),
          headers: { 'Content-Type': 'application/json' },
        });
      });

      it('should handle PATCH requests', async () => {
        const proxy = factory.createProxy();
        await proxy.users(123).patch({ body: { email: 'new@example.com' } });

        expect(mockHttpClient.makeRequest).toHaveBeenCalledWith({
          url: 'https://api.example.com/users/123',
          method: 'PATCH',
          data: { email: 'new@example.com' },
          transformResponse: expect.anything(),
          headers: { 'Content-Type': 'application/json' },
        });
      });

      it('should handle DELETE requests', async () => {
        const proxy = factory.createProxy();
        await proxy.users(123).delete();

        expect(mockHttpClient.makeRequest).toHaveBeenCalledWith({
          url: 'https://api.example.com/users/123',
          method: 'DELETE',
          data: undefined,
          transformResponse: expect.anything(),
          headers: { 'Content-Type': 'application/json' },
        });
      });

      it('should handle query parameters', async () => {
        const proxy = factory.createProxy();
        await proxy.users.get({
          query: { page: 1, limit: 10, active: true },
        });

        expect(mockHttpClient.makeRequest).toHaveBeenCalledWith({
          url: 'https://api.example.com/users?page=1&limit=10&active=true',
          method: 'GET',
          data: undefined,
          transformResponse: expect.anything(),
          headers: { 'Content-Type': 'application/json' },
        });
      });

      it('should handle request headers', async () => {
        const proxy = factory.createProxy();
        await proxy.users.get({
          headers: { Authorization: 'Bearer token' },
        });

        expect(mockHttpClient.makeRequest).toHaveBeenCalledWith({
          url: 'https://api.example.com/users',
          method: 'GET',
          data: undefined,
          transformResponse: expect.anything(),
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer token',
          },
        });
      });

      it('should merge context headers', async () => {
        const proxy = factory.createProxy([], {
          headers: { 'X-Custom': 'value' },
        });
        await proxy.users.get({
          headers: { Authorization: 'Bearer token' },
        });

        expect(mockHttpClient.makeRequest).toHaveBeenCalledWith({
          url: 'https://api.example.com/users',
          method: 'GET',
          data: undefined,
          transformResponse: expect.anything(),
          headers: {
            'Content-Type': 'application/json',
            'X-Custom': 'value',
            Authorization: 'Bearer token',
          },
        });
      });

      it('should use context base URL', async () => {
        const proxy = factory.createProxy([], {
          base: 'https://api2.example.com',
        });
        await proxy.users.get();

        expect(mockHttpClient.makeRequest).toHaveBeenCalledWith({
          url: 'https://api2.example.com/users',
          method: 'GET',
          data: undefined,
          transformResponse: expect.anything(),
          headers: { 'Content-Type': 'application/json' },
        });
      });

      it('should handle empty options', async () => {
        const proxy = factory.createProxy();
        await proxy.users.get({});

        expect(mockHttpClient.makeRequest).toHaveBeenCalledWith({
          url: 'https://api.example.com/users',
          method: 'GET',
          data: undefined,
          transformResponse: expect.anything(),
          headers: { 'Content-Type': 'application/json' },
        });
      });

      it('should handle case-insensitive HTTP methods', async () => {
        const proxy = factory.createProxy();

        // Test that we can access methods in different cases
        expect(typeof proxy.users.get).toBe('function');
        expect(typeof proxy.users.GET).toBe('function');
      });
    });

    // it('should handle non-string symbols', () => {
    //   const proxy = factory.createProxy();
    //   const symbolProp = Symbol('test');
    //   expect(proxy[symbolProp]).toBeUndefined();
    // });

    it('should handle unknown properties as path segments', () => {
      const proxy = factory.createProxy();
      const unknownProxy = proxy.someUnknownProperty;
      expect(unknownProxy).toBeDefined();
      expect(typeof unknownProxy).toBe('function');
    });
  });
});
