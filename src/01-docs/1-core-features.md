# Section 1 – Core Features

This document expands the Requirement spec section **1. Core Features** and ties it back to the concrete NestJS/GraphQL backend implementation. Use it as a bridge between product expectations and the codebase when prioritizing backlog items or onboarding new contributors.

---

## 1.1 User Management

### Implemented capabilities
- **Signup / Signin**: `signup` and `signin` mutations in `src/user/user.resolver.ts` persist passengers and return JWT-protected sessions.
- **Account lifecycle**: `deleteAccount` performs a soft delete, while the service automatically reactivates previously deleted accounts on signup (`src/user/user.service.ts`).
- **Profile data**: The `User` entity stores name + email fields and timestamp metadata (`src/user/entities/user.entity.ts`).
- **Authentication layer**: JWT strategy/guard (`src/auth/strategies/jwt.strategy.ts`, `src/auth/guards/jwt-auth.guard.ts`) protects queries that require an authenticated passenger context.

### Operational notes
- Passwords are hashed with bcrypt in `UserService.signup`.
- Default flags `isConfirmed` and `isActive` are true, keeping the MVP flow simple (OTP/email flows can hook into the same fields later).
- Example GraphQL queries/mutations are maintained in `src/02-Query/user.graphql` and mirrored inside `README.md`.

### Pending items
- OTP/email verification endpoints.
- Profile photo storage and preference management.
- Social login providers.

---

## 1.2 Booking System (overview)

The booking subsystem delivers every bullet outlined under Requirement 1.2:

- Pickup/destination capture with optional lat/long (`LocationInput` DTO).
- Vehicle type selection via the `VehicleType` enum.
- Instant vs. scheduled rides with automatic ETA/fare estimation in `BookingService`.
- Multi-stop itineraries (`stops` array on the `RideBooking` aggregate).
- Cancellation tracking with configurable penalty windows.

See the dedicated document `src/01-docs/1.2-booking-system.md` for a full deep dive that includes database layout, GraphQL payloads, and example requests.

---

## 1.3 Real-time Tracking (roadmap)

Not yet implemented. Planned scope:

- Driver & passenger live location streams (likely WebSocket + Redis pub/sub).
- Route visualization overlays + continuous ETA recalculation.
- Push notifications when the driver is approaching pickup.

Integration hooks to consider:
- Extend `RideBooking` with driver assignment metadata.
- Introduce a `location_updates` channel to broadcast GPS pings.
- Add subscription resolvers (`@Subscription`) when real-time infra lands.

---

## 1.4 Driver Management (roadmap)

Future module will cover driver onboarding, document capture, availability toggles, and earnings dashboards. Expect a sibling module to `booking/` with its own DTOs, Entities, and resolvers.

---

## 1.5 Payment System (roadmap)

Pending integration:

- Tokenized card storage via Stripe/PayPal/Razorpay SDKs.
- Wallet balance table plus promo code workflows.
- Webhook handlers for asynchronous payment events.

The current booking implementation exposes `estimatedFare` so that payment orchestrations can latch onto confirmed/completed rides later.

---

## 1.6 Rating & Reviews (roadmap)

- Requires bidirectional rating entities between passengers and drivers.
- Should surface summaries back to `RideBooking` objects for quick lookup.
- Needs moderation + abuse detection policy.

---

## Cross-cutting documentation

- `README.md` – top-level runbooks and GraphQL snippets.
- `src/01-docs/SETUP.md` – environment/bootstrap steps.
- `src/01-docs/GRAPHQL_TUTORIAL.md` – walkthrough of the GraphQL stack.
- `src/01-docs/1.2-booking-system.md` – booking deep dive (see above).

Keep these documents synchronized whenever new features land to preserve the traceability between Requirements §1.* and the NestJS codebase.


