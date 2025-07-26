import { createFetchero } from '../../../src/index';
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

describe('REST API Integration', () => {
  const fetchero = createFetchero({
    baseUrl: 'https://api.example.com',
    headers: { 'Content-Type': 'application/json' },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic REST operations', () => {
    it('should perform GET request', async () => {
      const responseData = { data: { id: 1, name: 'John' } };
      mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

      const result = await fetchero.rest.users.get();

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.example.com/users',
          method: 'GET',
        })
      );
      expect(result.data).toEqual({ id: 1, name: 'John' });
    });

    it('should perform POST request with data', async () => {
      const responseData = { data: { id: 2, name: 'Jane' } };
      mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

      const result = await fetchero.rest.users.post({
        body: { name: 'Jane', email: 'jane@example.com' },
      });

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.example.com/users',
          method: 'POST',
          data: { name: 'Jane', email: 'jane@example.com' },
        })
      );
      expect(result.data).toEqual({ id: 2, name: 'Jane' });
    });

    it('should handle nested paths', async () => {
      const responseData = { data: { id: 1, title: 'Post title' } };
      mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

      await fetchero.rest
        .users(123)
        .posts(456)
        .get();

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.example.com/users/123/posts/456',
        })
      );
    });

    it('should handle query parameters', async () => {
      const responseData = { data: [] };
      mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

      await fetchero.rest.users.get({
        query: { page: 1, limit: 10 },
      });

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.example.com/users?page=1&limit=10',
        })
      );
    });

    it('should handle custom headers', async () => {
      const responseData = { data: [] };
      mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

      await fetchero.rest.users.get({
        headers: { Authorization: 'Bearer token' },
      });

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token',
          }),
        })
      );
    });
  });

  describe('Configuration methods', () => {
    it('should handle base URL configuration', async () => {
      const responseData = { data: [] };
      mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

      await fetchero.rest.users.base('https://api2.example.com').get();

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api2.example.com/users',
        })
      );
    });

    it('should handle headers configuration', async () => {
      const responseData = { data: [] };
      mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

      await fetchero.rest.user.headers({ Authorization: 'Bearer token' }).get();

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token',
          }),
        })
      );
    });

    it('should chain configuration methods', async () => {
      const responseData = { data: [] };
      mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

      await fetchero.rest.users
        .base('https://api2.example.com')
        .headers({ Authorization: 'Bearer token' })
        .get();

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api2.example.com/users',
          headers: expect.objectContaining({
            Authorization: 'Bearer token',
          }),
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      const networkError = createMockError('Network Error');
      mockAxiosFunction.mockRejectedValue(networkError);

      const result = await fetchero.rest.users.get();

      expect(result.data).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].extensions.message).toBe('Network Error');
    });

    it('should handle HTTP errors', async () => {
      const httpError = createMockError('Not Found', 404, {
        message: 'User not found',
      });
      mockAxiosFunction.mockRejectedValue(httpError);

      const result = await fetchero.rest.users(999).get();

      expect(result.data).toBeNull();
      expect(result.errors![0].extensions.code).toBe('404');
      expect(result.errors![0].extensions.message).toBe('User not found');
    });
  });
});
