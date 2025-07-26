import { URLBuilder } from '../../../src/utils/url-builder';

describe('URLBuilder', () => {
  describe('build', () => {
    it('should build URL with segments', () => {
      const result = URLBuilder.build('https://api.example.com', [
        'users',
        '123',
      ]);
      expect(result).toBe('https://api.example.com/users/123');
    });

    it('should build URL with query parameters', () => {
      const result = URLBuilder.build('https://api.example.com', ['users'], {
        page: 1,
        limit: 10,
        active: true,
      });
      expect(result).toBe(
        'https://api.example.com/users?page=1&limit=10&active=true'
      );
    });

    it('should handle empty segments', () => {
      const result = URLBuilder.build('https://api.example.com', []);
      expect(result).toBe('https://api.example.com/');
    });

    it('should handle empty query parameters', () => {
      const result = URLBuilder.build('https://api.example.com', ['users'], {});
      expect(result).toBe('https://api.example.com/users');
    });

    it('should handle undefined query parameters', () => {
      const result = URLBuilder.build(
        'https://api.example.com',
        ['users'],
        undefined
      );
      expect(result).toBe('https://api.example.com/users');
    });

    it('should filter out null and undefined query values', () => {
      const result = URLBuilder.build('https://api.example.com', ['users'], {
        page: 1,
        limit: null,
        active: undefined,
        name: 'test',
      });
      expect(result).toBe('https://api.example.com/users?page=1&name=test');
    });

    it('should handle boolean query parameters', () => {
      const result = URLBuilder.build('https://api.example.com', ['users'], {
        active: false,
        verified: true,
      });
      expect(result).toBe(
        'https://api.example.com/users?active=false&verified=true'
      );
    });

    it('should handle numeric zero in query parameters', () => {
      const result = URLBuilder.build('https://api.example.com', ['users'], {
        page: 0,
        count: 0,
      });
      expect(result).toBe('https://api.example.com/users?page=0&count=0');
    });

    it('should handle special characters in segments', () => {
      const result = URLBuilder.build('https://api.example.com', [
        'users',
        'test@email.com',
      ]);
      expect(result).toBe('https://api.example.com/users/test@email.com');
    });

    it('should handle special characters in query parameters', () => {
      const result = URLBuilder.build('https://api.example.com', ['search'], {
        q: 'hello world',
        filter: 'type:user',
      });
      expect(result).toBe(
        'https://api.example.com/search?q=hello+world&filter=type%3Auser'
      );
    });

    it('should throw error for empty base URL', () => {
      expect(() => URLBuilder.build('', ['users'])).toThrow(
        'Base URL must be a non-empty string'
      );
    });

    it('should throw error for null base URL', () => {
      expect(() => URLBuilder.build(null as any, ['users'])).toThrow(
        'Base URL must be a non-empty string'
      );
    });

    it('should throw error for undefined base URL', () => {
      expect(() => URLBuilder.build(undefined as any, ['users'])).toThrow(
        'Base URL must be a non-empty string'
      );
    });

    it('should throw error for non-string base URL', () => {
      expect(() => URLBuilder.build(123 as any, ['users'])).toThrow(
        'Base URL must be a non-empty string'
      );
    });

    it('should throw error for invalid base URL', () => {
      expect(() => URLBuilder.build('invalid-url', ['users'])).toThrow(
        'Invalid URL construction'
      );
    });

    it('should handle base URL with trailing slash', () => {
      const result = URLBuilder.build('https://api.example.com/', ['users']);
      expect(result).toBe('https://api.example.com/users');
    });

    it('should handle base URL without protocol', () => {
      expect(() => URLBuilder.build('api.example.com', ['users'])).toThrow(
        'Invalid URL construction'
      );
    });

    it('should handle complex nested segments', () => {
      const result = URLBuilder.build('https://api.example.com', [
        'v1',
        'users',
        '123',
        'posts',
        '456',
        'comments',
      ]);
      expect(result).toBe(
        'https://api.example.com/v1/users/123/posts/456/comments'
      );
    });

    it('should handle query parameters with empty string values', () => {
      const result = URLBuilder.build('https://api.example.com', ['users'], {
        name: '',
        status: 'active',
      });
      expect(result).toBe('https://api.example.com/users?name=&status=active');
    });
  });
});
