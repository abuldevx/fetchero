import { IErrors, IMessage } from '../types/common';

/**
 * Utility class for error handling and formatting
 */
export class ErrorHandler {
  /**
   * Checks if the error indicates a "not found" status
   */
  static isNotFound(errors: IErrors[]): boolean {
    return errors?.[0]?.extensions?.code === '404';
  }

  /**
   * Formats error code with proper structure
   */
  private static formatErrorCode({
    code,
    extensions,
    message,
  }: IErrors): IErrors {
    return {
      message,
      extensions: { code, ...extensions },
    };
  }

  /**
   * Formats error message structure
   */
  private static formatErrorMessage({ extensions, message }: IErrors): IErrors {
    return {
      extensions: { message, ...extensions },
    };
  }

  /**
   * Formats complete error response with default messages
   */
  private static formatErrorResponse({ extensions }: IErrors): IErrors {
    const { code, message = '' } = extensions;

    // Handle 422 errors with object messages
    let processedMessage = message;
    if (code === '422' && typeof message === 'object' && message !== null) {
      processedMessage = Object.values(message).join(', ');
    }

    const defaultMessages: Record<string, string | IMessage> = {
      401: message,
      404: message,
      500: message,
      422: processedMessage,
      BAD_USER_INPUT: 'Input is not valid',
      INTERNAL_SERVER_ERROR: 'Internal Server Error',
    };

    return {
      extensions: {
        code,
        message: code ? defaultMessages[code] || 'Unknown error' : '',
      },
    };
  }

  /**
   * Composes error formatting functions
   */
  static compose(error: IErrors): IErrors {
    const formatters = [
      this.formatErrorCode,
      this.formatErrorMessage,
      this.formatErrorResponse,
    ];

    return formatters.reduce((acc, formatter) => {
      return formatter === this.formatErrorCode
        ? formatter({
            code: acc.extensions.code || '',
            extensions: acc.extensions,
            message: acc.extensions.message || '',
          })
        : formatter(acc);
    }, error);
  }

  /**
   * Creates standardized error response
   */
  static makeErrorResponse({
    code,
    message,
  }: {
    message: string;
    code: number;
  }): IErrors {
    return {
      message: 'Internal Server Error',
      extensions: {
        message,
        error: true,
        code: String(code),
      },
    };
  }
}
