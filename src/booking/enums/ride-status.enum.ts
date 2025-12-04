import { registerEnumType } from '@nestjs/graphql';

export enum RideStatus {
  PENDING_DRIVER = 'PENDING_DRIVER',
  SCHEDULED = 'SCHEDULED',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  EN_ROUTE_TO_PICKUP = 'EN_ROUTE_TO_PICKUP',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

registerEnumType(RideStatus, {
  name: 'RideStatus',
  description: 'Lifecycle states for a ride booking',
});


