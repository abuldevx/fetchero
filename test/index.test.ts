import { createFetchero } from '../src';
import fetch from 'cross-fetch';

import axios from 'axios';

jest.mock('axios', () => ({
  __esModule: true,
  default: jest.fn(async ({ url, data: body, ...rest }) => {
    try {
      console.log({ url, body, rest });
      const response = await fetch(url, {
        ...rest,
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      return { data };
    } catch (error) {
      console.log(error);
      return Promise.resolve({ data: { errors: [] } });
    }
  }),
}));

const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('gql', () => {
  test('should first', async () => {
    const { rest } = createFetchero({
      baseUrl: 'https://jsonplaceholder.typicode.com',
    });

    const res = await rest.todos.posts
      .comments(4)
      .post({ query: { page: 10, perPage: 20 }, body: { name: 'abul' } });

    console.log('Query with selection:', res);
    expect(mockedAxios).toHaveBeenCalledWith('');
  });

  test.only('should run graphql', async () => {
    const { gql } = createFetchero({
      baseUrl: 'https://graphqlzero.almansi.me/api',
    });

    const res = await gql.query
      .user({ id: { type: 'ID!', value: 1 } })
      .select('id');
    // const res = await gql.query
    //   .user({ id: { type: 'ID!', value: 1 } })
    //   .select('id');
    // const res2 = await gql.query.user.select('id');
    console.log('Query with selection:', res);
    // expect(mockedAxios).toHaveBeenCalledWith('');
  });
});
