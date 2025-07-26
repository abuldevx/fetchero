import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { HttpClient } from '../../../src/core/http-client';

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

describe('HttpClient', () => {
  let httpClient: HttpClient;
  const baseUrl = 'https://api.example.com';
  const headers = { 'Content-Type': 'application/json' };

  beforeEach(() => {
    jest.clearAllMocks();
    httpClient = new HttpClient(baseUrl, headers);
  });

  describe('makeRequest', () => {
    it('should make successful request', async () => {
      const responseData = { data: { id: 1, name: 'Test' } };
      mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

      const result = await httpClient.makeRequest({
        url: 'https://api.example.com/users',
        method: 'GET',
      });

      expect(result).toEqual({
        data: { id: 1, name: 'Test' },
      });
    });

    it('should handle GraphQL errors in response', async () => {
      const responseData = {
        data: { user: null },
        errors: [{ message: 'User not found', extensions: { code: '404' } }],
      };
      mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

      const result = await httpClient.makeRequest({
        url: 'https://api.example.com/graphql',
        method: 'POST',
      });

      expect(result.data).toEqual({ user: null });
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].extensions.code).toBe('404');
    });

    it('should handle multiple GraphQL errors', async () => {
      const responseData = {
        data: null,
        errors: [
          { message: 'Error 1', extensions: { code: '400' } },
          { message: 'Error 2', extensions: { code: '422' } },
        ],
      };
      mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

      const result = await httpClient.makeRequest({
        url: 'https://api.example.com/graphql',
        method: 'POST',
      });

      expect(result.errors).toHaveLength(2);
    });

    it('should add default timeout', async () => {
      mockAxiosFunction.mockResolvedValue(createMockResponse({ data: 'test' }));

      await httpClient.makeRequest({
        url: 'https://api.example.com/test',
        method: 'GET',
      });

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 30000,
        })
      );
    });

    it('should preserve existing timeout', async () => {
      mockAxiosFunction.mockResolvedValue(createMockResponse({ data: 'test' }));

      await httpClient.makeRequest({
        url: 'https://api.example.com/test',
        method: 'GET',
        timeout: 5000,
      });

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 5000,
        })
      );
    });

    it('should handle request interceptor', async () => {
      const requestInterceptor = jest.fn(config => ({
        ...config,
        headers: { ...config.headers, 'X-Intercepted': 'true' },
      }));

      httpClient = new HttpClient(baseUrl, headers, {
        request: requestInterceptor,
      });

      mockAxiosFunction.mockResolvedValue(createMockResponse({ data: 'test' }));

      await httpClient.makeRequest({
        url: 'https://api.example.com/test',
        method: 'GET',
      });

      expect(requestInterceptor).toHaveBeenCalled();
      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Intercepted': 'true',
          }),
        })
      );
    });

    it('should handle async request interceptor', async () => {
      const requestInterceptor = jest.fn(async config => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { ...config, headers: { ...config.headers, 'X-Async': 'true' } };
      });

      httpClient = new HttpClient(baseUrl, headers, {
        request: requestInterceptor,
      });

      mockAxiosFunction.mockResolvedValue(createMockResponse({ data: 'test' }));

      await httpClient.makeRequest({
        url: 'https://api.example.com/test',
        method: 'GET',
      });

      expect(requestInterceptor).toHaveBeenCalled();
    });

    it.skip('should handle response interceptor', async () => {
      const responseInterceptor = jest.fn(response => ({
        ...response,
        data: { intercepted: true },
      }));

      httpClient = new HttpClient(baseUrl, headers, {
        response: responseInterceptor,
      });

      mockAxiosFunction.mockResolvedValue(
        createMockResponse({ data: 'original' })
      );

      const result = await httpClient.makeRequest({
        url: 'https://api.example.com/test',
        method: 'GET',
      });

      expect(responseInterceptor).toHaveBeenCalled();
      expect(result).toEqual({ intercepted: true });
    });

    it('should handle missing URL error', async () => {
      const result = await httpClient.makeRequest({
        method: 'GET',
      } as any);

      expect(result.data).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].extensions.message).toBe(
        'Request URL is required'
      );
    });

    it('should handle network timeout error', async () => {
      const timeoutError = createMockError('timeout of 5000ms exceeded');
      timeoutError.code = 'ECONNABORTED';
      mockAxiosFunction.mockRejectedValue(timeoutError);

      const result = await httpClient.makeRequest({
        url: 'https://api.example.com/test',
        method: 'GET',
      });

      expect(result.data).toBeNull();
      expect(result.errors![0].extensions.message).toBe('Request timeout');
      expect(result.errors![0].extensions.code).toBe('408');
    });

    it('should handle connection refused error', async () => {
      const connectionError = createMockError('connect ECONNREFUSED');
      connectionError.code = 'ECONNREFUSED';
      mockAxiosFunction.mockRejectedValue(connectionError);

      const result = await httpClient.makeRequest({
        url: 'https://api.example.com/test',
        method: 'GET',
      });

      expect(result.errors![0].extensions.message).toBe(
        'Network connection failed'
      );
    });

    it('should handle DNS resolution error', async () => {
      const dnsError = createMockError('getaddrinfo ENOTFOUND');
      dnsError.code = 'ENOTFOUND';
      mockAxiosFunction.mockRejectedValue(dnsError);

      const result = await httpClient.makeRequest({
        url: 'https://api.example.com/test',
        method: 'GET',
      });

      expect(result.errors![0].extensions.message).toBe(
        'Network connection failed'
      );
    });

    it('should handle HTTP error responses', async () => {
      const httpError = createMockError(
        'Request failed with status code 404',
        404,
        {
          message: 'Not found',
        }
      );
      mockAxiosFunction.mockRejectedValue(httpError);

      const result = await httpClient.makeRequest({
        url: 'https://api.example.com/test',
        method: 'GET',
      });

      expect(result.errors![0].extensions.code).toBe('404');
      expect(result.errors![0].extensions.message).toBe('Not found');
    });

    it('should handle HTTP error with error field', async () => {
      const httpError = createMockError('Bad request', 400, {
        error: 'Invalid input',
      });
      mockAxiosFunction.mockRejectedValue(httpError);

      const result = await httpClient.makeRequest({
        url: 'https://api.example.com/test',
        method: 'GET',
      });

      expect(result.errors![0].extensions.message).toBe('Invalid input');
    });

    it('should handle generic error', async () => {
      const genericError = createMockError('Something went wrong');
      mockAxiosFunction.mockRejectedValue(genericError);

      const result = await httpClient.makeRequest({
        url: 'https://api.example.com/test',
        method: 'GET',
      });

      expect(result.errors![0].extensions.message).toBe('Something went wrong');
      expect(result.errors![0].extensions.code).toBe('500');
    });

    it('should handle response with null data', async () => {
      mockAxiosFunction.mockResolvedValue(createMockResponse(null));

      const result = await httpClient.makeRequest({
        url: 'https://api.example.com/test',
        method: 'GET',
      });

      expect(result.data).toBeNull();
    });

    it('should handle response with empty body', async () => {
      mockAxiosFunction.mockResolvedValue({ data: null } as any);

      const result = await httpClient.makeRequest({
        url: 'https://api.example.com/test',
        method: 'GET',
      });

      expect(result.data).toBeNull();
    });

    it('should handle non-GraphQL response format', async () => {
      const responseData = { id: 1, name: 'Direct data' };
      mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

      const result = await httpClient.makeRequest({
        url: 'https://api.example.com/test',
        method: 'GET',
      });

      expect(result.data).toBeNull(); // Because it expects { data: ... } format
    });
  });
});
