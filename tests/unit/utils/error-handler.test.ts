import { ErrorHandler } from '../../../src/utils/error-handler';
import { IErrors } from '../../../src/types/common';

describe('ErrorHandler', () => {
  describe('isNotFound', () => {
    it('should return true for 404 errors', () => {
      const errors: IErrors[] = [
        { extensions: { code: '404' }, message: 'Not found' },
      ];
      expect(ErrorHandler.isNotFound(errors)).toBe(true);
    });

    it('should return false for non-404 errors', () => {
      const errors: IErrors[] = [
        { extensions: { code: '500' }, message: 'Server error' },
      ];
      expect(ErrorHandler.isNotFound(errors)).toBe(false);
    });

    it('should return false for empty errors array', () => {
      expect(ErrorHandler.isNotFound([])).toBe(false);
    });

    it('should return false for null/undefined errors', () => {
      expect(ErrorHandler.isNotFound(null as any)).toBe(false);
      expect(ErrorHandler.isNotFound(undefined as any)).toBe(false);
    });

    it('should return false when first error has no extensions', () => {
      const errors: IErrors[] = [{ extensions: {} }];
      expect(ErrorHandler.isNotFound(errors)).toBe(false);
    });

    it('should return false when first error has no code', () => {
      const errors: IErrors[] = [{ extensions: { message: 'Error' } }];
      expect(ErrorHandler.isNotFound(errors)).toBe(false);
    });
  });

  describe('compose', () => {
    it('should compose error with all formatting steps', () => {
      const input: IErrors = {
        extensions: {
          code: '422',
          message: 'Validation failed',
        },
      };

      const result = ErrorHandler.compose(input);

      expect(result).toEqual({
        extensions: {
          code: '422',
          message: 'Validation failed',
        },
      });
    });

    it('should handle 422 errors with object messages', () => {
      const input: IErrors = {
        extensions: {
          code: '422',
          message: { field1: 'Error 1', field2: 'Error 2' },
        },
      };

      const result = ErrorHandler.compose(input);

      expect(result.extensions.message).toBe('Error 1, Error 2');
    });

    it('should handle errors without code', () => {
      const input: IErrors = {
        extensions: {
          message: 'Some error',
        },
      };

      const result = ErrorHandler.compose(input);

      expect(result.extensions.message).toBe('');
    });

    it('should handle BAD_USER_INPUT code', () => {
      const input: IErrors = {
        extensions: {
          code: 'BAD_USER_INPUT',
          message: 'Invalid input',
        },
      };

      const result = ErrorHandler.compose(input);

      expect(result.extensions.message).toBe('Input is not valid');
    });

    it('should handle INTERNAL_SERVER_ERROR code', () => {
      const input: IErrors = {
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Server crashed',
        },
      };

      const result = ErrorHandler.compose(input);

      expect(result.extensions.message).toBe('Internal Server Error');
    });

    it('should handle unknown error codes', () => {
      const input: IErrors = {
        extensions: {
          code: 'UNKNOWN_ERROR',
          message: 'Unknown',
        },
      };

      const result = ErrorHandler.compose(input);

      expect(result.extensions.message).toBe('Unknown error');
    });

    it.skip('should preserve additional extensions', () => {
      const input: IErrors = {
        extensions: {
          code: '400',
          message: 'Bad request',
          customField: 'custom value',
          anotherField: 123,
        },
      };

      const result = ErrorHandler.compose(input);

      expect(result.extensions.customField).toBe('custom value');
      expect(result.extensions.anotherField).toBe(123);
    });

    it('should handle null and undefined message in 422 errors', () => {
      const inputNull: IErrors = {
        extensions: {
          code: '422',
        },
      };

      const inputUndefined: IErrors = {
        extensions: {
          code: '422',
          message: undefined,
        },
      };

      const resultNull = ErrorHandler.compose(inputNull);
      const resultUndefined = ErrorHandler.compose(inputUndefined);

      expect(resultNull.extensions.message).toBe('Unknown error');
      expect(resultUndefined.extensions.message).toBe('Unknown error');
    });
  });

  describe('makeErrorResponse', () => {
    it('should create standardized error response', () => {
      const result = ErrorHandler.makeErrorResponse({
        code: 500,
        message: 'Server error',
      });

      expect(result).toEqual({
        message: 'Internal Server Error',
        extensions: {
          message: 'Server error',
          error: true,
          code: '500',
        },
      });
    });

    it('should handle different status codes', () => {
      const result = ErrorHandler.makeErrorResponse({
        code: 404,
        message: 'Not found',
      });

      expect(result.extensions.code).toBe('404');
      expect(result.extensions.message).toBe('Not found');
    });

    it('should handle zero status code', () => {
      const result = ErrorHandler.makeErrorResponse({
        code: 0,
        message: 'Network error',
      });

      expect(result.extensions.code).toBe('0');
    });

    it('should handle empty message', () => {
      const result = ErrorHandler.makeErrorResponse({
        code: 400,
        message: '',
      });

      expect(result.extensions.message).toBe('');
    });
  });
});
