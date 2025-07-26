/**
 * Input validation utilities
 */
export class Validators {
  /**
   * Validates URL format
   */
  static validateUrl(url: string): void {
    try {
      new URL(url);
    } catch {
      throw new Error(`Invalid URL format: ${url}`);
    }
  }

  /**
   * Validates headers object
   */
  static validateHeaders(headers: Record<string, string>): void {
    if (
      !headers ||
      Object.prototype.toString.call(headers) !== '[object Object]'
    ) {
      throw new Error('Headers must be a valid object');
    }
  }

  /**
   * Validates GraphQL field selection
   */
  static validateFields(fields: string): void {
    if (typeof fields !== 'string' || !fields.trim()) {
      throw new Error('Field selection must be a non-empty string');
    }
  }

  /**
   * Validates GraphQL arguments
   */
  static validateGraphQLArgs(args: any): void {
    if (args && Object.prototype.toString.call(args) !== '[object Object]') {
      throw new Error('GraphQL arguments must be an object');
    }
  }

  /**
   * Validates constructor arguments
   */
  static validateConstructorArgs(baseUrl: string): void {
    if (!baseUrl || typeof baseUrl !== 'string') {
      throw new Error('Fetchero: "baseUrl" must be a non-empty string.');
    }

    try {
      new URL(baseUrl);
    } catch {
      throw new Error('Fetchero: "baseUrl" must be a valid URL.');
    }
  }
}
