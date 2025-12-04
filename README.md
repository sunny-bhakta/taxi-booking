# Taxi Booking App - Backend

A taxi booking application backend built with NestJS and GraphQL.

## Features

- User Management (Signup, Signin, Account Deletion)
- Ride Booking (pickup & destination capture, vehicle selection, instant or scheduled rides, multi-stop routing, auto fare + ETA estimates, cancellation policy)
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

### Create Ride Booking (Requires Authentication)
```graphql
mutation BookRide($pickup: LocationInput!, $destination: LocationInput!) {
  createRideBooking(
    input: {
      pickup: $pickup
      destination: $destination
      stops: [
        {
          address: "Coffee stop"
          latitude: 40.742
          longitude: -73.989
        }
      ]
      vehicleType: PREMIUM
      scheduledAt: "2025-12-04T19:30:00.000Z"
      note: "Need infant seat"
    }
  ) {
    id
    status
    vehicleType
    estimatedFare
    estimatedArrival
    isInstant
  }
}

# Variables
{
  "pickup": {
    "address": "1 Market St, SF",
    "latitude": 37.7937,
    "longitude": -122.3950
  },
  "destination": {
    "address": "1500 Mariposa St, SF",
    "latitude": 37.7649,
    "longitude": -122.3994
  }
}
```

### List & Cancel Rides (Requires Authentication)
```graphql
query {
  myRides(status: SCHEDULED) {
    id
    status
    vehicleType
    pickupLocation {
      address
    }
    scheduledAt
    estimatedArrival
  }
}

mutation {
  cancelRide(input: { rideId: "a-booking-id", reason: "Plans changed" }) {
    id
    status
    cancellationPenalty
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
├── booking/           # Ride booking module (entities, resolver, service, DTOs)
│   ├── dto/
│   ├── entities/
│   ├── enums/
│   ├── models/
│   ├── booking.module.ts
│   ├── booking.resolver.ts
│   └── booking.service.ts
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
- `npm test` - Run the unit test suite (resolver/service coverage)
- `npm run test:e2e` - Run end-to-end GraphQL flow tests (uses in-memory SQLite)

> **Tip:** Ensure `sqlite3` is installed locally before running e2e tests; the suite spins up a fresh Nest app, seeds via GraphQL mutations, and requires the dependency at runtime.

## Additional Documentation

For more detailed documentation, see the `src/01-docs/` folder:
- [Setup Guide](src/01-docs/SETUP.md) - Detailed setup instructions and API examples
- [Requirements](src/01-docs/REQUIREMENTS.md) - Complete project requirements and specifications
- [GraphQL Tutorial](src/01-docs/GRAPHQL_TUTORIAL.md) - Extended GraphQL walkthrough with booking examples

## Notes

- Users are confirmed by default upon signup (no OTP verification required)
- Account deletion is soft delete (users can be restored)
- JWT tokens expire after 7 days
- Booking creation automatically estimates fare + ETA based on the provided coordinates (or fallback heuristics) and enforces a 5-minute (instant) / 30-minute (scheduled) cancellation window
- Make sure to change JWT_SECRET in production

