# **Fetchero**

_A type-safe, proxy-based HTTP & GraphQL client for modern applications._

`fetchero` is a lightweight, flexible, and highly intuitive library for making **REST** and **GraphQL** requests.  
It uses **Proxies** for a **chainable API**, **interceptors** for pre/post-processing, and **enhanced error handling** for safer, predictable responses.

Whether you're consuming REST APIs or working with GraphQL backends, Fetchero simplifies the process with a **declarative, fluent syntax** that feels natural and reduces boilerplate.

---

## **Table of Contents**

1.  [Features](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#features)

2.  [Installation](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#installation)

3.  [Basic Usage](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#basic-usage)

    - [Create an instance](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#create-an-instance)

    - [REST & GraphQL as standalone clients](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#or-individually)

4.  [REST Client](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#rest-client)

    - [Making requests](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#making-requests)

    - [Dynamic path segments](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#dynamic-path-segments)

    - [Override base URL or headers](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#override-base-url-or-headers)

5.  [GraphQL Client](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#graphql-client)

    - [Queries](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#queries)

    - [Mutations](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#mutations)

    - [Subscriptions](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#subscriptions)

    - [Override base URL & headers](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#override-base-url--headers)

6.  [Interceptors](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#interceptors)

7.  [Error Handling](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#error-handling)

8.  [Response Shape](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#response-shape)

9.  [Examples](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#examples)

10. [TypeScript Support](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#typescript-support)

11. [API Overview](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#api-overview)

12. [Why Fetchero?](https://chatgpt.com/c/6875f925-1c40-800b-ab53-7a47568a65d8#why-fetchero)

---

## **Features**

- **Proxy-based REST client** — Build endpoints dynamically using dot-chaining and path arguments. No manual string concatenation.

- **GraphQL client with query builder** — Write GraphQL queries fluently, with support for variables and field selection.

- **Base URL & dynamic headers** — Override base URLs and headers globally or per-request.

- **Interceptors** — Hook into requests and responses for logging, authentication, and transformation.

- **Error handling** — Standardized error objects with meaningful messages and GraphQL error normalization.

- **Fully TypeScript ready** — Get autocompletion and type safety for your API calls.

---

## **Installation**

```bash
npm install fetchero

```

or

```bash
yarn add fetchero

```

---

## **Basic Usage**

### **Create an instance**

```ts
import { createFetchero } from 'fetchero';

const api = createFetchero({
  baseUrl: 'https://api.example.com',
  headers: { Authorization: 'Bearer token' },
});
```

### **Or individually**

If you only need one client type (REST or GraphQL):

```ts
import { rest, gql } from 'fetchero';
const restClient = rest({ baseUrl: '...' });
const gqlClient = gql({ baseUrl: '...' });
```

---

## **REST Client**

### **Making requests**

```ts
// GET /users
const res = await api.rest.users.get();

// GET /users/123
const res = await api.rest.users(123).get();

// GET /users/123?active=true
const res = await api.rest.users(123).get({ query: { active: true } });

// POST /users with body
const res = await api.rest.users.post({ body: { name: 'John' } });
```

### **Dynamic path segments**

```ts
// GET /users/123/posts/456
const res = await api.rest
  .users(123)
  .posts(456)
  .get();
```

### **Override base URL or headers**

```ts
// Different base URL
await api.rest.users.base('https://another-api.com').get();

// Add/override headers
await api.rest.users.headers({ Authorization: 'Bearer new-token' }).get();
```

---

## **GraphQL Client**

Fetchero provides a **fluent query builder** for GraphQL.

### **Queries**

```ts
// Basic query
const res = await api.gql.query.getUser({ id: 123 }).select('id name email');
```

This builds and executes:

```graphql
query {
  getUser(id: 123) {
    id
    name
    email
  }
}
```

### **Mutations**

```ts
const res = await api.gql.mutation
  .createUser({ name: 'John' })
  .select('id name');
```

### **Subscriptions**

```ts
const res = await api.gql.subscription
  .onMessage({ roomId: 1 })
  .select('id content');
```

---

### **Passing Arguments & Variables**

Fetchero automatically converts JS objects into **typed GraphQL variables**.

#### **Plain Arguments (Auto-inferred types)**

```ts
await api.gql.query.getUser({ id: 1 }).select('id name');
```

**Builds:**

```graphql
query my_query($id_0: Int) {
  getUser(id: $id_0) {
    id
    name
  }
}
```

#### **Custom Types**

Wrap values in `{ value, type }` to define the GraphQL type explicitly:

```ts
await api.gql.query
  .getUser({ id: 1, status: { value: 'ACTIVE', type: 'StatusEnum!' } })
  .select('id name status');
```

**Builds:**

```graphql
query my_query($id_0: Int, $status_0: StatusEnum!) {
  getUser(id: $id_0, status: $status_0) {
    id
    name
    status
  }
}
```

#### **Nested Input Objects**

You can pass complex input types like this:

```ts
await api.gql.mutation.updateUser({
  id: 1,
  profile: {
    type: 'UserProfileInput',
    value: { age: 30, email: 'john@example.com' },
  },
});
```

**Builds:**

```graphql
mutation my_mutation($id_0: Int, $profile_0: UserProfileInput) {
  updateUser(id: $id_0, profile: $profile_0)
}
```

#### **Rules for Arguments**

- **Plain values** → Auto-inferred type (`Int`, `String`, `Float`).

- **`{ value, type }`** → Explicit GraphQL type.

- **Nested objects** → Use `{ type: 'MyInputType', value: { ... } }`.

- **Invalid values (arrays, functions, etc.)** → Throw an error.

---

### **Override base URL & headers**

```ts
await api.gql.query
  .getUser({ id: 123 })
  .base('https://graphql.alt.com')
  .headers({ Authorization: 'Bearer new' })
  .select('id name');
```

---

## **Interceptors**

Intercept and modify **requests** and **responses** globally.

```ts
import { createFetchero } from 'fetchero';

const api = createFetchero({
  baseUrl: 'https://api.example.com',
  interceptors: {
    request: async config => {
      console.log('Outgoing Request:', config);
      return config;
    },
    response: async response => {
      console.log('Incoming Response:', response.data);
      return response.data;
    },
  },
});
```

---

## **Error Handling**

All errors are standardized:

```ts
const res = await api.rest.users(999).get();

if (res.errors) {
  console.log(res.errors[0].extensions.message); // "Not Found"
}
```

GraphQL errors are automatically normalized using `errorCompose`.

---

## **Response Shape**

Every request returns:

```ts
interface FetcherResponse<T> {
  data: T | null;
  errors?: Array<{
    message?: string;
    extensions: { code?: string; message?: string };
  }>;
}
```

---

## **Examples**

### **Chained REST call with query & headers**

```ts
await api.rest
  .users(42)
  .headers({ 'X-Custom': 'yes' })
  .posts.get({ query: { page: 2 } });
```

### **GraphQL query with variables**

```ts
await api.gql.query
  .searchUsers({ name: { type: 'String!', value: 'John' } })
  .select('id name email');
```

---

## **TypeScript Support**

Type definitions are included out of the box for:

- REST responses

- GraphQL queries/mutations

- Errors & interceptors

---

## **API Overview**

### **REST**

- `api.rest[resource]` — Chainable resource paths

- Methods: `.get()`, `.post()`, `.put()`, `.patch()`, `.delete()`

- Modifiers: `.base(url)`, `.headers({ ... })`

### **GraphQL**

- `api.gql.query.field(args).select(fields)`

- Operations: `query`, `mutation`, `subscription`

- Modifiers: `.base(url)`, `.headers({ ... })`

---

## **Why Fetchero?**

- No need to manually build URLs or queries.

- Fluent, chainable API.

- Works equally well for REST & GraphQL.

- Easy integration with TypeScript & interceptors.
