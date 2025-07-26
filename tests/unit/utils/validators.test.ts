import { Validators } from '../../../src/utils/validators';

describe('Validators', () => {
  describe('validateUrl', () => {
    it('should not throw for valid URLs', () => {
      expect(() => Validators.validateUrl('https://example.com')).not.toThrow();
      expect(() =>
        Validators.validateUrl('http://localhost:3000')
      ).not.toThrow();
      expect(() =>
        Validators.validateUrl('https://api.example.com/v1')
      ).not.toThrow();
    });

    it('should throw for invalid URLs', () => {
      expect(() => Validators.validateUrl('invalid-url')).toThrow(
        'Invalid URL format: invalid-url'
      );
      expect(() => Validators.validateUrl('')).toThrow('Invalid URL format: ');
      expect(() => Validators.validateUrl('just-text')).toThrow(
        'Invalid URL format: just-text'
      );
    });

    it('should handle URL with special characters', () => {
      expect(() =>
        Validators.validateUrl('https://example.com/path with spaces')
      ).not.toThrow();
    });
  });

  describe('validateHeaders', () => {
    it('should not throw for valid headers', () => {
      expect(() => Validators.validateHeaders({})).not.toThrow();
      expect(() =>
        Validators.validateHeaders({ 'Content-Type': 'application/json' })
      ).not.toThrow();
      expect(() =>
        Validators.validateHeaders({
          Authorization: 'Bearer token',
          'X-Custom': 'value',
        })
      ).not.toThrow();
    });

    it('should throw for invalid headers', () => {
      expect(() => Validators.validateHeaders(null as any)).toThrow(
        'Headers must be a valid object'
      );
      expect(() => Validators.validateHeaders(undefined as any)).toThrow(
        'Headers must be a valid object'
      );
      expect(() => Validators.validateHeaders('string' as any)).toThrow(
        'Headers must be a valid object'
      );
      expect(() => Validators.validateHeaders(123 as any)).toThrow(
        'Headers must be a valid object'
      );
      expect(() => Validators.validateHeaders([] as any)).toThrow(
        'Headers must be a valid object'
      );
    });
  });

  describe('validateFields', () => {
    it('should not throw for valid field strings', () => {
      expect(() => Validators.validateFields('id')).not.toThrow();
      expect(() => Validators.validateFields('id name email')).not.toThrow();
      expect(() => Validators.validateFields('user { id name }')).not.toThrow();
    });

    it('should throw for invalid field strings', () => {
      expect(() => Validators.validateFields('')).toThrow(
        'Field selection must be a non-empty string'
      );
      expect(() => Validators.validateFields('   ')).toThrow(
        'Field selection must be a non-empty string'
      );
      expect(() => Validators.validateFields(null as any)).toThrow(
        'Field selection must be a non-empty string'
      );
      expect(() => Validators.validateFields(undefined as any)).toThrow(
        'Field selection must be a non-empty string'
      );
      expect(() => Validators.validateFields(123 as any)).toThrow(
        'Field selection must be a non-empty string'
      );
    });
  });

  describe('validateGraphQLArgs', () => {
    it('should not throw for valid GraphQL arguments', () => {
      expect(() => Validators.validateGraphQLArgs({})).not.toThrow();
      expect(() => Validators.validateGraphQLArgs({ id: 123 })).not.toThrow();
      expect(() =>
        Validators.validateGraphQLArgs({ id: { type: 'ID', value: '123' } })
      ).not.toThrow();
      expect(() => Validators.validateGraphQLArgs(null)).not.toThrow();
      expect(() => Validators.validateGraphQLArgs(undefined)).not.toThrow();
    });

    it('should throw for invalid GraphQL arguments', () => {
      expect(() => Validators.validateGraphQLArgs('string')).toThrow(
        'GraphQL arguments must be an object'
      );
      expect(() => Validators.validateGraphQLArgs(123)).toThrow(
        'GraphQL arguments must be an object'
      );
      expect(() => Validators.validateGraphQLArgs([])).toThrow(
        'GraphQL arguments must be an object'
      );
    });
  });

  describe('validateConstructorArgs', () => {
    it('should not throw for valid base URLs', () => {
      expect(() =>
        Validators.validateConstructorArgs('https://api.example.com')
      ).not.toThrow();
      expect(() =>
        Validators.validateConstructorArgs('http://localhost:3000')
      ).not.toThrow();
    });

    it('should throw for invalid base URLs', () => {
      expect(() => Validators.validateConstructorArgs('')).toThrow(
        'Fetchero: "baseUrl" must be a non-empty string.'
      );
      expect(() => Validators.validateConstructorArgs(null as any)).toThrow(
        'Fetchero: "baseUrl" must be a non-empty string.'
      );
      expect(() =>
        Validators.validateConstructorArgs(undefined as any)
      ).toThrow('Fetchero: "baseUrl" must be a non-empty string.');
      expect(() => Validators.validateConstructorArgs(123 as any)).toThrow(
        'Fetchero: "baseUrl" must be a non-empty string.'
      );
    });

    it('should throw for malformed URLs', () => {
      expect(() => Validators.validateConstructorArgs('invalid-url')).toThrow(
        'Fetchero: "baseUrl" must be a valid URL.'
      );
      expect(() => Validators.validateConstructorArgs('just text')).toThrow(
        'Fetchero: "baseUrl" must be a valid URL.'
      );
    });
  });
});
