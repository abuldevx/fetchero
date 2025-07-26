import { Fetchero } from '../../../src/core/fetchero';
import { createFetchero, rest, gql } from '../../../src/factories';

// Mock the Fetchero class
jest.mock('../../../src/core/fetchero');
const MockedFetchero = Fetchero as jest.MockedClass<typeof Fetchero>;

describe('Factory functions', () => {
  const validOptions = {
    baseUrl: 'https://api.example.com',
    headers: { 'Content-Type': 'application/json' },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the Fetchero instance
    const mockInstance = {
      rest: { mockRest: true } as any,
      gql: { mockGql: true } as any,
    };
    MockedFetchero.mockImplementation(() => mockInstance as any);
  });

  describe('createFetchero', () => {
    it('should create Fetchero instance and return both interfaces', () => {
      const result = createFetchero(validOptions);

      expect(MockedFetchero).toHaveBeenCalledWith(validOptions);
      expect(result).toEqual({
        rest: { mockRest: true },
        gql: { mockGql: true },
      });
    });

    it('should be immutable return object', () => {
      const result = createFetchero(validOptions);

      // The result should be readonly
      expect(Object.isFrozen(result)).toBe(true);
    });
  });

  describe('rest', () => {
    it('should create Fetchero instance and return REST interface', () => {
      const result = rest(validOptions);

      expect(MockedFetchero).toHaveBeenCalledWith(validOptions);
      expect(result).toEqual({ mockRest: true });
    });
  });

  describe('gql', () => {
    it('should create Fetchero instance and return GraphQL interface', () => {
      const result = gql(validOptions);

      expect(MockedFetchero).toHaveBeenCalledWith(validOptions);
      expect(result).toEqual({ mockGql: true });
    });
  });
});
