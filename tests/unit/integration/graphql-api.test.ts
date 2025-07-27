import { createFetchero } from '../../../src/index';
import { buildQuery } from '../../../src/utils/build-query';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

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
jest.mock('../../../src/utils/build-query');

const mockAxiosFunction = axios as jest.MockedFunction<typeof axios>;
const mockBuildQuery = buildQuery as jest.MockedFunction<typeof buildQuery>;

describe('GraphQL API Integration', () => {
  const fetchero = createFetchero({
    baseUrl: 'https://api.example.com/graphql',
    headers: { 'Content-Type': 'application/json' },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockBuildQuery.mockReturnValue({
      query: 'query { user { id name } }',
      variables: {},
    });
  });

  describe('Query operations', () => {
    it('should perform basic query', async () => {
      const responseData = {
        data: { user: { id: '1', name: 'John' } },
      };
      mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

      const result = await fetchero.gql.query.user.select('id name');

      expect(mockBuildQuery).toHaveBeenCalled();
      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api.example.com/graphql',
          method: 'POST',
          data: {
            query: 'query { user { id name } }',
            variables: {},
          },
        })
      );
      expect(result.data).toEqual({ user: { id: '1', name: 'John' } });
    });

    it('should handle query with arguments', async () => {
      mockBuildQuery.mockReturnValue({
        query: 'query { user(id: $id) { id name } }',
        variables: { id: '123' },
      });

      const responseData = {
        data: { user: { id: '123', name: 'John' } },
      };
      mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

      await fetchero.gql.query.user({ id: '123' }).select('id name');

      expect(mockBuildQuery).toHaveBeenCalledWith(
        expect.arrayContaining(['query { user (', ') { id name } }']),
        { id: '123' }
      );
    });

    it('should handle execute method', async () => {
      const responseData = {
        data: { user: { id: '1' } },
      };
      mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

      await fetchero.gql.query.user.execute();

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            query: 'query { user { id name } }',
            variables: {},
          },
        })
      );
    });

    // it('should handle Promise-like then method', async () => {
    //   const responseData = {
    //     data: { user: { id: '1', name: 'John' } },
    //   };
    //   mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

    //   const resolveFn = jest.fn();
    //   await fetchero.gql.query.user.then(resolveFn);

    //   expect(resolveFn).toHaveBeenCalledWith({
    //     data: { user: { id: '1', name: 'John' } },
    //   });
    // });
  });

  describe('Mutation operations', () => {
    it('should perform mutations', async () => {
      mockBuildQuery.mockReturnValue({
        query: 'mutation { createUser(input: $input) { id } }',
        variables: { input: { name: 'John' } },
      });

      const responseData = {
        data: { createUser: { id: '1' } },
      };
      mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

      await fetchero.gql.mutation.createUser({ name: 'John' }).execute();

      expect(mockBuildQuery).toHaveBeenCalledWith(
        expect.arrayContaining(['mutation { createUser (', ') { id } }']),
        { name: 'John' }
      );
    });
  });

  describe('Subscription operations', () => {
    it('should perform subscriptions', async () => {
      mockBuildQuery.mockReturnValue({
        query: 'subscription { userUpdated { id name } }',
        variables: {},
      });

      const responseData = {
        data: { userUpdated: { id: '1', name: 'John Updated' } },
      };
      mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

      await fetchero.gql.subscription.userUpdated.execute();

      expect(mockBuildQuery).toHaveBeenCalledWith(
        expect.arrayContaining(['subscription { userUpdated ', ' { id } }']),
        {}
      );
    });
  });

  describe('Configuration', () => {
    it('should handle base URL configuration', async () => {
      const responseData = { data: { user: { id: '1' } } };
      mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

      await fetchero.gql.query.user
        .base('https://api2.example.com/graphql')
        .execute();

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://api2.example.com/graphql',
        })
      );
    });

    it('should handle headers configuration', async () => {
      const responseData = { data: { user: { id: '1' } } };
      mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

      await fetchero.gql.query.user
        .headers({ Authorization: 'Bearer token' })
        .execute();

      expect(mockAxiosFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer token',
          }),
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should handle GraphQL errors', async () => {
      const responseData = {
        data: null,
        errors: [
          {
            message: 'User not found',
            extensions: { code: 'NOT_FOUND' },
          },
        ],
      };
      mockAxiosFunction.mockResolvedValue(createMockResponse(responseData));

      const result = await fetchero.gql.query.user.execute();

      expect(result.data).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0].extensions.code).toBe('NOT_FOUND');
    });
  });
});
