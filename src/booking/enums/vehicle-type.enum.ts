import { registerEnumType } from '@nestjs/graphql';

export enum VehicleType {
  ECONOMY = 'ECONOMY',
  PREMIUM = 'PREMIUM',
  SUV = 'SUV',
  EXECUTIVE = 'EXECUTIVE',
}

registerEnumType(VehicleType, {
  name: 'VehicleType',
  description: 'Supported vehicle categories for taxi bookings',
});


