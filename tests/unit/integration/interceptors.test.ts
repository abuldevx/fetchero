import { createFetchero } from '../../../src/index';
import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

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

describe('Interceptors Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Request interceptors', () => {
    it('should apply request interceptor', async () => {
      const requestInterceptor = jest.fn(config => ({
        ...config,
        headers: {
          ...config.headers,
          'X-Request-ID': '12345',
        },
      }));

      const fetchero = createFetchero({
        baseUrl: 'https://api.example.com',
        interceptors: {
          request: requestInterceptor,
        },
      });

      mockAxiosFunction.mockResolvedValue(
        createMockResponse({ data: { success: true } })
      );

      await fetchero.rest.users.get();

      expect(requestInterceptor).toHaveBeenCalled();
      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Request-ID': '12345',
          }),
        })
      );
    });

    it('should handle async request interceptor', async () => {
      const requestInterceptor = jest.fn(async config => {
        // Simulate async operation (e.g., getting token)
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          ...config,
          headers: {
            ...config.headers,
            Authorization: 'Bearer async-token',
          },
        };
      });

      const fetchero = createFetchero({
        baseUrl: 'https://api.example.com',
        interceptors: {
          request: requestInterceptor,
        },
      });

      mockAxiosFunction.mockResolvedValue(
        createMockResponse({ data: { success: true } })
      );

      await fetchero.rest.users.get();

      expect(requestInterceptor).toHaveBeenCalled();
      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer async-token',
          }),
        })
      );
    });
  });

  describe('Response interceptors', () => {
    it('should apply response interceptor', async () => {
      const responseInterceptor = jest.fn(response => ({
        data: { intercepted: true, original: response.data },
      }));

      const fetchero = createFetchero({
        baseUrl: 'https://api.example.com',
        interceptors: {
          response: responseInterceptor as <T = unknown>(
            response: AxiosResponse<T>
          ) => Promise<T> | T,
        },
      });

      mockAxiosFunction.mockResolvedValue(
        createMockResponse({ data: { success: true } })
      );

      const result = await fetchero.rest.users.get();

      expect(responseInterceptor).toHaveBeenCalled();
      expect(result).toEqual({
        data: { intercepted: true, original: { data: { success: true } } },
      });
    });

    it('should handle async response interceptor', async () => {
      const responseInterceptor = jest.fn(async response => {
        // Simulate async processing
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          data: { processed: true, original: response.data },
        };
      });

      const fetchero = createFetchero({
        baseUrl: 'https://api.example.com',
        interceptors: {
          response: responseInterceptor as <T = unknown>(
            response: any
          ) => Promise<T>,
        },
      });

      mockAxiosFunction.mockResolvedValue(
        createMockResponse({ data: { success: true } })
      );

      const result = await fetchero.rest.users.get();

      expect(responseInterceptor).toHaveBeenCalled();
      expect(result).toEqual({
        data: { processed: true, original: { data: { success: true } } },
      });
    });
  });

  describe('Combined interceptors', () => {
    it('should apply both request and response interceptors', async () => {
      const requestInterceptor = jest.fn(config => ({
        ...config,
        headers: {
          ...config.headers,
          'X-Request-Time': Date.now().toString(),
        },
      }));

      const responseInterceptor = jest.fn(response => ({
        data: {
          ...response.data,
          data: {
            ...response.data.data,
            processed: true,
          },
        },
      }));

      const fetchero = createFetchero({
        baseUrl: 'https://api.example.com',
        interceptors: {
          request: requestInterceptor,
          response: responseInterceptor as <T = unknown>(
            response: any
          ) => Promise<T> | T,
        },
      });

      mockAxiosFunction.mockResolvedValue(
        createMockResponse({ data: { id: 1, name: 'John' } })
      );

      const result = await fetchero.rest.users.get();

      expect(requestInterceptor).toHaveBeenCalled();
      expect(responseInterceptor).toHaveBeenCalled();
      expect(result.data).toEqual({
        data: { id: 1, name: 'John', processed: true },
      });
    });
  });
});
