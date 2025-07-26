import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { FetcherResponse, FetcheroOptions } from '../types';
import { ErrorHandler } from '../utils';

/**
 * Core HTTP client functionality
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly interceptors?: FetcheroOptions['interceptors'];

  constructor(
    baseUrl: string,
    headers: Record<string, string>,
    interceptors?: FetcheroOptions['interceptors']
  ) {
    this.baseUrl = baseUrl;
    this.headers = headers;
    this.interceptors = interceptors;
  }

  /**
   * Enhanced HTTP request handler with better error handling and performance
   */
  async makeRequest<T = unknown>(
    config: AxiosRequestConfig
  ): Promise<FetcherResponse<T>> {
    try {
      // Validate config
      if (!config.url) {
        throw new Error('Request URL is required');
      }

      if (this.baseUrl && this.headers) {
        // todo: will handle on next phase
      }

      // Apply request interceptor
      const finalConfig = this.interceptors?.request
        ? await this.interceptors.request(config)
        : config;

      // Add timeout if not specified
      if (!finalConfig.timeout) {
        finalConfig.timeout = 30000; // 30 seconds default
      }

      // Execute request
      const result: AxiosResponse<{ data: T; errors?: any[] }> = await axios(
        finalConfig
      );

      // Safely extract response data
      const { data: responseData, errors } = result.data || {};

      // Build response object
      const response: FetcherResponse<T> = {
        data: responseData ?? null,
      };

      // Handle GraphQL errors with improved error processing
      if (errors && Array.isArray(errors) && errors.length > 0) {
        response.errors = errors.map(error => ErrorHandler.compose(error));
      }

      // Apply response interceptor
      return this.interceptors?.response
        ? await this.interceptors.response(result)
        : response;
    } catch (err) {
      return this.handleRequestError(err);
    }
  }

  /**
   * Enhanced error handling with better error categorization
   */
  private handleRequestError<T = unknown>(err: unknown): FetcherResponse<T> {
    const error = err as AxiosError<{ message?: string; error?: string }>;

    // Determine error status and message
    const status =
      error.response?.status ?? (error.code === 'ECONNABORTED' ? 408 : 500);

    let message: string;
    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.response?.data?.error) {
      message = error.response.data.error;
    } else if (error.code === 'ECONNABORTED') {
      message = 'Request timeout';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      message = 'Network connection failed';
    } else {
      message = error.message || 'Network request failed';
    }

    return {
      data: null,
      errors: [ErrorHandler.makeErrorResponse({ code: status, message })],
    };
  }
}
