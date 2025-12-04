# Taxi Booking App - Backend

A taxi booking application backend built with NestJS and GraphQL.

## Features

- User Management (Signup, Signin, Account Deletion)
- GraphQL API
- JWT Authentication
- SQLite Database with TypeORM
- User confirmation by default (no OTP verification)

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Install SQLite dependency:
```bash
npm install sqlite3
```

3. Set up environment variables (optional):
```bash
cp .env.example .env
```

Edit `.env` file with your JWT secret (database will be created automatically).

4. Start the application:
```bash
npm run start:dev
```

The application will be available at:
- API: http://localhost:3000
- Apollo Sandbox: http://localhost:3000/graphql

## GraphQL Queries and Mutations

### Signup
```graphql
mutation {
  signup(createUserInput: {
    email: "user@example.com"
    firstName: "John"
    lastName: "Doe"
    password: "password123"
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

### Signin
```graphql
mutation {
  signin(loginInput: {
    email: "user@example.com"
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

### Get Current User (Requires Authentication)
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

Headers:
```
Authorization: Bearer <your-access-token>
```

### Delete Account (Requires Authentication)
```graphql
mutation {
  deleteAccount
}
```

Headers:
```
Authorization: Bearer <your-access-token>
```

### Get All Users (Requires Authentication)
```graphql
query {
  users {
    id
    email
    firstName
    lastName
    isConfirmed
    createdAt
  }
}
```

Headers:
```
Authorization: Bearer <your-access-token>
```

## Project Structure

```
src/
├── auth/              # Authentication module
│   ├── guards/       # JWT guard
│   ├── strategies/   # JWT strategy
│   └── decorators/   # Custom decorators
├── user/             # User module
│   ├── dto/          # Data Transfer Objects
│   ├── entities/     # TypeORM entities
│   ├── user.service.ts
│   ├── user.resolver.ts
│   └── user.module.ts
├── app.module.ts     # Root module
└── main.ts           # Application entry point
```

## Scripts

- `npm run start:dev` - Start development server with watch mode
- `npm run build` - Build the application
- `npm run start:prod` - Start production server
- `npm run lint` - Run linter

## Additional Documentation

For more detailed documentation, see the `src/docs/` folder:
- [Setup Guide](src/docs/SETUP.md) - Detailed setup instructions and API examples
- [Requirements](src/docs/REQUIREMENTS.md) - Complete project requirements and specifications

## Notes

- Users are confirmed by default upon signup (no OTP verification required)
- Account deletion is soft delete (users can be restored)
- JWT tokens expire after 7 days
- Make sure to change JWT_SECRET in production

