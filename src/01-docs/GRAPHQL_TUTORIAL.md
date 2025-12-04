# GraphQL Concepts Tutorial - Using Taxi Booking Project Examples

## Table of Contents
1. [What is GraphQL?](#what-is-graphql)
2. [Core Concepts](#core-concepts)
3. [GraphQL Schema](#graphql-schema)
4. [Types and Fields](#types-and-fields)
5. [Queries](#queries)
6. [Mutations](#mutations)
7. [Input Types](#input-types)
8. [Resolvers](#resolvers)
9. [NestJS GraphQL Implementation](#nestjs-graphql-implementation)
10. [Real Examples from Your Project](#real-examples-from-your-project)
11. [Best Practices](#best-practices)

---

## What is GraphQL?

GraphQL is a **query language for APIs** and a **runtime for executing those queries**. Unlike REST APIs where you have multiple endpoints, GraphQL provides a single endpoint that allows clients to request exactly the data they need.

### Key Advantages:
- **Single Endpoint**: One endpoint (`/graphql`) handles all requests
- **Client-Driven**: Clients specify exactly what fields they want
- **Strongly Typed**: Schema defines all available data and operations
- **Introspection**: Schema is self-documenting

---

## Core Concepts

### 1. Schema
The **schema** is the contract between client and server. It defines:
- What data can be queried
- What operations are available
- What types of data exist

**In your project**: The schema is auto-generated in `src/schema.gql` from your TypeScript decorators.

### 2. Types
Types define the shape of data. GraphQL has:
- **Object Types**: Complex objects (like `User`)
- **Scalar Types**: Primitive values (`String`, `Int`, `Boolean`, `ID`, `DateTime`)
- **Input Types**: Used for mutations (like `CreateUserInput`)

### 3. Queries
**Queries** are read operations - they fetch data without modifying it.

### 4. Mutations
**Mutations** are write operations - they modify data (create, update, delete).

### 5. Resolvers
**Resolvers** are functions that handle the logic for queries and mutations. They resolve the requested data.

---

## GraphQL Schema

Let's look at your generated schema (`src/schema.gql`):

```graphql
type Query {
  me: User!
  users: [User!]!
}

type Mutation {
  deleteAccount: Boolean!
  signin(loginInput: LoginInput!): AuthResponse!
  signup(createUserInput: CreateUserInput!): User!
}
```

### Explanation:
- **`Query`**: Root type for all read operations
- **`Mutation`**: Root type for all write operations
- **`!`**: Means the field is **required** (non-nullable)
- **`[User!]!`**: Array of non-null User objects, and the array itself is non-null

---

## Types and Fields

### Object Type Example: `User`

```graphql
type User {
  id: ID!
  email: String!
  firstName: String!
  lastName: String!
  isActive: Boolean!
  isConfirmed: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  deletedAt: DateTime  # nullable (no !)
}
```

**In your code** (`src/user/entities/user.entity.ts`):

```typescript
@ObjectType()  // Marks this as a GraphQL Object Type
@Entity('users')
export class User {
  @Field(() => ID)  // GraphQL field decorator
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()  // Exposed in GraphQL schema
  @Column({ unique: true })
  email: string;

  @Field()
  @Column()
  firstName: string;

  // password field is NOT exposed (no @Field decorator)
  @Column()
  password: string;  // Hidden from GraphQL for security
}
```

### Key Points:
- **`@ObjectType()`**: Marks the class as a GraphQL type
- **`@Field()`**: Exposes a property in the GraphQL schema
- **No `@Field()`**: Property is hidden from GraphQL (like `password`)
- **`@Field(() => ID)`**: Explicitly sets the GraphQL type to `ID`

---

## Queries

Queries are read-only operations. In your project, you have two queries:

### 1. `me` Query - Get Current User

**Schema Definition:**
```graphql
type Query {
  me: User!
}
```

**Resolver Implementation** (`src/user/user.resolver.ts`):
```typescript
@Query(() => User)  // Defines a GraphQL query returning User
@UseGuards(JwtAuthGuard)  // Requires authentication
async me(@Context() context): Promise<User> {
  return this.userService.findOne(context.req.user.userId);
}
```

**Client Query Example:**
```graphql
query {
  me {
    id
    email
    firstName
    lastName
    isConfirmed
    createdAt
  }
}
```

**What happens:**
1. Client sends query with selected fields
2. `@UseGuards(JwtAuthGuard)` validates JWT token
3. Resolver extracts user ID from context
4. Service fetches user from database
5. GraphQL returns only requested fields

### 2. `users` Query - Get All Users

**Schema Definition:**
```graphql
type Query {
  users: [User!]!
}
```

**Resolver Implementation:**
```typescript
@Query(() => [User])  // Returns array of User
@UseGuards(JwtAuthGuard)
async users(): Promise<User[]> {
  return this.userService.findAll();
}
```

**Client Query Example:**
```graphql
query {
  users {
    id
    email
    firstName
  }
}
```

---

## Mutations

Mutations modify data. Your project has three mutations:

### 1. `signup` Mutation - Create User

**Schema Definition:**
```graphql
type Mutation {
  signup(createUserInput: CreateUserInput!): User!
}
```

**Resolver Implementation:**
```typescript
@Mutation(() => User)  // Defines a GraphQL mutation
async signup(
  @Args('createUserInput') createUserInput: CreateUserInput
): Promise<User> {
  return this.userService.signup(createUserInput);
}
```

**Client Mutation Example:**
```graphql
mutation {
  signup(createUserInput: {
    email: "john@example.com"
    firstName: "John"
    lastName: "Doe"
    password: "password123"
  }) {
    id
    email
    firstName
    lastName
    createdAt
  }
}
```

### 2. `signin` Mutation - Login

**Schema Definition:**
```graphql
type Mutation {
  signin(loginInput: LoginInput!): AuthResponse!
}
```

**Resolver Implementation:**
```typescript
@Mutation(() => AuthResponse)
async signin(
  @Args('loginInput') loginInput: LoginInput
): Promise<AuthResponse> {
  return this.userService.signin(loginInput);
}
```

**Client Mutation Example:**
```graphql
mutation {
  signin(loginInput: {
    email: "john@example.com"
    password: "password123"
  }) {
    accessToken
    user {
      id
      email
      firstName
      lastName
    }
  }
}
```

### 3. `deleteAccount` Mutation - Delete User

**Schema Definition:**
```graphql
type Mutation {
  deleteAccount: Boolean!
}
```

**Resolver Implementation:**
```typescript
@Mutation(() => Boolean)
@UseGuards(JwtAuthGuard)
async deleteAccount(@Context() context): Promise<boolean> {
  return this.userService.deleteAccount(context.req.user.userId);
}
```

**Client Mutation Example:**
```graphql
mutation {
  deleteAccount
}
```

---

## Input Types

Input types are used to pass complex data to mutations. They're defined with `@InputType()`.

### Example: `CreateUserInput`

**Schema Definition:**
```graphql
input CreateUserInput {
  email: String!
  firstName: String!
  lastName: String!
  password: String!
}
```

**TypeScript Implementation** (`src/user/dto/create-user.input.ts`):
```typescript
@InputType()  // Marks as GraphQL Input Type
export class CreateUserInput {
  @Field()  // Each field must be decorated
  @IsEmail()  // Validation decorator
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  firstName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
```

### Example: `LoginInput`

**Schema Definition:**
```graphql
input LoginInput {
  email: String!
  password: String!
}
```

**TypeScript Implementation:**
```typescript
@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  password: string;
}
```

### Key Differences: Input vs Object Types

| Feature | Object Type (`@ObjectType`) | Input Type (`@InputType`) |
|---------|---------------------------|--------------------------|
| Used for | Return values | Mutation arguments |
| Can have | Methods, computed fields | Only simple fields |
| Example | `User`, `AuthResponse` | `CreateUserInput`, `LoginInput` |

---

## Resolvers

Resolvers are functions that handle GraphQL operations. In NestJS, they're classes decorated with `@Resolver()`.

### Your Resolver (`src/user/user.resolver.ts`):

```typescript
@Resolver(() => User)  // Associates resolver with User type
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  // Query resolver
  @Query(() => User)
  async me(@Context() context): Promise<User> {
    return this.userService.findOne(context.req.user.userId);
  }

  // Mutation resolver
  @Mutation(() => User)
  async signup(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.userService.signup(createUserInput);
  }
}
```

### Resolver Decorators:

- **`@Resolver(() => User)`**: Associates resolver with a type
- **`@Query(() => ReturnType)`**: Defines a query operation
- **`@Mutation(() => ReturnType)`**: Defines a mutation operation
- **`@Args('argName')`**: Extracts argument from GraphQL query/mutation
- **`@Context()`**: Accesses GraphQL context (request, user, etc.)

---

## NestJS GraphQL Implementation

### Module Setup (`src/app.module.ts`):

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,  // Uses Apollo Server
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),  // Auto-generates schema
  sortSchema: true,  // Sorts schema alphabetically
  introspection: true,  // Enables GraphQL playground
  context: ({ req }) => ({ req }),  // Makes request available in context
})
```

### Key Configuration Options:

- **`autoSchemaFile`**: Automatically generates schema from decorators
- **`introspection`**: Enables GraphQL playground/sandbox
- **`context`**: Provides request context to resolvers
- **`sortSchema`**: Keeps schema organized

---

## Real Examples from Your Project

### Complete Flow: User Signup

**1. Client sends mutation:**
```graphql
mutation SignupUser {
  signup(createUserInput: {
    email: "alice@example.com"
    firstName: "Alice"
    lastName: "Smith"
    password: "secure123"
  }) {
    id
    email
    firstName
    lastName
    isConfirmed
    createdAt
  }
}
```

**2. GraphQL receives request:**
- Validates `CreateUserInput` structure
- Routes to `UserResolver.signup()`

**3. Resolver executes:**
```typescript
@Mutation(() => User)
async signup(@Args('createUserInput') createUserInput: CreateUserInput) {
  return this.userService.signup(createUserInput);
}
```

**4. Service processes:**
- Validates input (email format, password length)
- Hashes password
- Creates user in database
- Returns User entity

**5. GraphQL returns response:**
```json
{
  "data": {
    "signup": {
      "id": "uuid-here",
      "email": "alice@example.com",
      "firstName": "Alice",
      "lastName": "Smith",
      "isConfirmed": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Complete Flow: Authenticated Query

**1. Client sends query with auth header:**
```http
POST /graphql
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "query": "query { me { id email firstName } }"
}
```

**2. Guard validates token:**
```typescript
@UseGuards(JwtAuthGuard)  // Validates JWT before resolver runs
async me(@Context() context): Promise<User> {
  // context.req.user is populated by guard
  return this.userService.findOne(context.req.user.userId);
}
```

**3. Resolver executes with authenticated user**

**4. Returns user data**

---

## Advanced Concepts

### 1. Field Resolvers

You can create resolvers for specific fields. For example, if you wanted a computed field:

```typescript
@Resolver(() => User)
export class UserResolver {
  @FieldResolver(() => String)
  fullName(@Parent() user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }
}
```

Then in schema:
```graphql
type User {
  fullName: String!  # Computed field
}
```

### 2. Nested Types

Your `AuthResponse` type contains a nested `User`:

```graphql
type AuthResponse {
  accessToken: String!
  user: User!  # Nested type
}
```

**Implementation:**
```typescript
@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field(() => User)  // References User type
  user: User;
}
```

### 3. Nullable vs Non-Nullable

- **`String!`**: Required, cannot be null
- **`String`**: Optional, can be null
- **`[User!]!`**: Non-null array of non-null Users
- **`[User]!`**: Non-null array (but Users can be null)
- **`[User!]`**: Nullable array of non-null Users

**In your project:**
```graphql
type User {
  deletedAt: DateTime  # Nullable (soft delete)
  email: String!       # Required
}
```

### 4. Scalar Types

GraphQL has built-in scalars:
- **`String`**: Text
- **`Int`**: Integer
- **`Float`**: Decimal
- **`Boolean`**: true/false
- **`ID`**: Unique identifier (serialized as string)

**Custom Scalar** (DateTime in your project):
```graphql
scalar DateTime
```

---

## Best Practices

### 1. **Separate Concerns**
- **Resolvers**: Handle GraphQL-specific logic
- **Services**: Handle business logic
- **Entities**: Define data structure

### 2. **Hide Sensitive Data**
```typescript
@ObjectType()
export class User {
  @Field()
  email: string;

  // No @Field() = hidden from GraphQL
  @Column()
  password: string;  // Never exposed!
}
```

### 3. **Use Input Types for Mutations**
Always use `@InputType()` for complex mutation arguments:
```typescript
// ✅ Good
@Mutation(() => User)
async signup(@Args('createUserInput') input: CreateUserInput) {}

// ❌ Bad
@Mutation(() => User)
async signup(
  @Args('email') email: string,
  @Args('firstName') firstName: string,
  // ... too many args
) {}
```

### 4. **Validate Inputs**
Use class-validator decorators:
```typescript
@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
```

### 5. **Use Guards for Authentication**
```typescript
@Query(() => User)
@UseGuards(JwtAuthGuard)  // Protects the endpoint
async me(@Context() context): Promise<User> {
  // User is authenticated here
}
```

### 6. **Request Only Needed Fields**
GraphQL allows clients to request exactly what they need:

```graphql
# ✅ Efficient - only gets needed fields
query {
  me {
    id
    email
  }
}

# ❌ Inefficient - gets all fields
query {
  me {
    id
    email
    firstName
    lastName
    isActive
    isConfirmed
    createdAt
    updatedAt
    deletedAt
  }
}
```

### 7. **Use Context for Request Data**
```typescript
@Query(() => User)
async me(@Context() context): Promise<User> {
  // Access request, user, etc. from context
  const userId = context.req.user.userId;
  return this.userService.findOne(userId);
}
```

---

## Common Patterns in Your Project

### Pattern 1: Authentication Flow
```typescript
// 1. Signup (public)
@Mutation(() => User)
async signup(@Args('createUserInput') input: CreateUserInput) {}

// 2. Signin (public) - returns token
@Mutation(() => AuthResponse)
async signin(@Args('loginInput') input: LoginInput) {}

// 3. Protected queries/mutations
@Query(() => User)
@UseGuards(JwtAuthGuard)  // Requires token
async me(@Context() context) {}
```

### Pattern 2: Input Validation
```typescript
@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail()           // Validates email format
  @IsNotEmpty()        // Ensures not empty
  email: string;

  @Field()
  @MinLength(6)       // Minimum length
  password: string;
}
```

### Pattern 3: Type Safety
```typescript
@Mutation(() => User)  // Return type
async signup(
  @Args('createUserInput') createUserInput: CreateUserInput  // Input type
): Promise<User> {  // TypeScript return type
  return this.userService.signup(createUserInput);
}
```

---

## Testing GraphQL Queries

### Using Apollo Sandbox (http://localhost:3000/graphql)

**1. Simple Query:**
```graphql
query {
  users {
    id
    email
    firstName
  }
}
```

**2. Query with Variables:**
```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    email
  }
}
```
Variables:
```json
{
  "id": "user-uuid-here"
}
```

**3. Mutation:**
```graphql
mutation {
  signup(createUserInput: {
    email: "test@example.com"
    firstName: "Test"
    lastName: "User"
    password: "password123"
  }) {
    id
    email
  }
}
```

**4. Query with Headers:**
Add HTTP Headers in Apollo Sandbox:
```json
{
  "Authorization": "Bearer your-jwt-token-here"
}
```

---

## Summary

### Key Takeaways:

1. **GraphQL Schema** = Contract defining available data and operations
2. **Types** = Shape of data (`@ObjectType` for returns, `@InputType` for inputs)
3. **Queries** = Read operations (`@Query`)
4. **Mutations** = Write operations (`@Mutation`)
5. **Resolvers** = Functions that handle operations (`@Resolver`)
6. **Fields** = Properties exposed in schema (`@Field()`)
7. **Context** = Request data available to resolvers (`@Context()`)
8. **Guards** = Authentication/authorization (`@UseGuards()`)

### Your Project Structure:

```
src/
├── schema.gql              # Auto-generated GraphQL schema
├── app.module.ts           # GraphQL module configuration
└── user/
    ├── entities/
    │   └── user.entity.ts  # @ObjectType - defines User type
    ├── dto/
    │   ├── create-user.input.ts  # @InputType - mutation input
    │   └── auth-response.type.ts # @ObjectType - return type
    └── user.resolver.ts    # @Resolver - handles queries/mutations
```

---

## Next Steps

1. **Explore the schema**: Open `src/schema.gql` to see the generated schema
2. **Try queries**: Use Apollo Sandbox at http://localhost:3000/graphql
3. **Add new types**: Create new `@ObjectType` classes
4. **Add new queries**: Add `@Query()` methods to resolvers
5. **Add new mutations**: Add `@Mutation()` methods to resolvers

Happy coding! 🚀

