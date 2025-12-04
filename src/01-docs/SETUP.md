# Setup Guide

## Quick Start

1. **Install all dependencies:**
```bash
npm install
```

2. **Install SQLite dependency:**
```bash
npm install sqlite3
```

3. **Configure environment variables (optional):**
   - Copy `.env.example` to `.env`
   - Update the JWT secret in `.env` (database will be created automatically as `taxi_booking.db`)

4. **Start the development server:**
```bash
npm run start:dev
```

5. **Access Apollo Sandbox:**
   - Open browser: http://localhost:3000/graphql

## Testing the API

### 1. Signup (Create Account)
```graphql
mutation {
  signup(createUserInput: {
    email: "john.doe@example.com"
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

### 2. Signin (Login)
```graphql
mutation {
  signin(loginInput: {
    email: "john.doe@example.com"
    password: "password123"
  }) {
    accessToken
    user {
      id
      email
      firstName
      lastName
      isConfirmed
    }
  }
}
```

### 3. Get Current User (Requires Auth)
In the Apollo Sandbox, add HTTP Headers:
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN_HERE"
}
```

Then run:
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

### 4. Delete Account (Requires Auth)
With Authorization header:
```graphql
mutation {
  deleteAccount
}
```

## Features Implemented

✅ User Signup (with email, firstName, lastName, password)
✅ User Signin (returns JWT token)
✅ User confirmation by default (no OTP verification)
✅ Account deletion (soft delete)
✅ JWT Authentication
✅ GraphQL API
✅ TypeORM with SQLite
✅ Password hashing with bcrypt

## Project Structure

```
src/
├── auth/
│   ├── guards/          # JWT authentication guard
│   ├── strategies/      # JWT strategy for Passport
│   └── decorators/      # Custom decorators
├── user/
│   ├── dto/            # GraphQL input/output types
│   ├── entities/       # TypeORM entities
│   ├── user.service.ts # Business logic
│   ├── user.resolver.ts # GraphQL resolvers
│   └── user.module.ts  # User module
├── docs/               # Documentation files
│   ├── SETUP.md        # Setup guide
│   └── REQUIREMENTS.md # Project requirements
├── app.module.ts       # Root module
└── main.ts            # Application entry point
```

