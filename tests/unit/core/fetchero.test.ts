import { Fetchero } from '../../../src/core/fetchero';
import { FetcheroOptions } from '../../../src/types/common';

describe('Fetchero', () => {
  const validOptions: FetcheroOptions = {
    baseUrl: 'https://api.example.com',
    headers: { 'Content-Type': 'application/json' },
  };

  describe('constructor', () => {
    it('should create Fetchero instance with valid options', () => {
      const fetchero = new Fetchero(validOptions);
      expect(fetchero).toBeInstanceOf(Fetchero);
    });

    it('should validate base URL', () => {
      expect(() => new Fetchero({ ...validOptions, baseUrl: '' })).toThrow(
        'Fetchero: "baseUrl" must be a non-empty string.'
      );
    });

    it('should validate URL format', () => {
      expect(
        () => new Fetchero({ ...validOptions, baseUrl: 'invalid-url' })
      ).toThrow('Fetchero: "baseUrl" must be a valid URL.');
    });

    it('should handle missing headers', () => {
      const fetchero = new Fetchero({ baseUrl: 'https://api.example.com' });
      expect(fetchero).toBeInstanceOf(Fetchero);
    });

    it('should handle interceptors', () => {
      const interceptors = {
        request: jest.fn(),
        response: jest.fn(),
      };

      const fetchero = new Fetchero({
        ...validOptions,
        interceptors,
      });

      expect(fetchero).toBeInstanceOf(Fetchero);
    });
  });

  describe('rest getter', () => {
    it('should return REST proxy', () => {
      const fetchero = new Fetchero(validOptions);
      const restProxy = fetchero.rest;
      expect(restProxy).toBeDefined();
    });

    it('should return same proxy instance on multiple calls', () => {
      const fetchero = new Fetchero(validOptions);
      const restProxy1 = fetchero.rest;
      const restProxy2 = fetchero.rest;
      expect(restProxy1).toBe(restProxy2);
    });
  });

  describe('gql getter', () => {
    it('should return GraphQL proxy', () => {
      const fetchero = new Fetchero(validOptions);
      const gqlProxy = fetchero.gql;
      expect(gqlProxy).toBeDefined();
    });

    it('should return same proxy instance on multiple calls', () => {
      const fetchero = new Fetchero(validOptions);
      const gqlProxy1 = fetchero.gql;
      const gqlProxy2 = fetchero.gql;
      expect(gqlProxy1).toBe(gqlProxy2);
    });
  });
});
