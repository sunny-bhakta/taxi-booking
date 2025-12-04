import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { RideBooking } from './entities/ride-booking.entity';
import { CreateRideBookingInput } from './dto/create-ride-booking.input';
import { CancelRideInput } from './dto/cancel-ride.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RideStatus } from './enums/ride-status.enum';

@Resolver(() => RideBooking)
@UseGuards(JwtAuthGuard)
export class BookingResolver {
  constructor(private readonly bookingService: BookingService) {}

  @Mutation(() => RideBooking, {
    description: 'Creates a ride booking with fare + ETA estimates',
  })
  createRideBooking(
    @Context() context,
    @Args('input') input: CreateRideBookingInput,
  ): Promise<RideBooking> {
    return this.bookingService.createRideBooking(this.getUserId(context), input);
  }

  @Mutation(() => RideBooking, {
    description: 'Cancels an existing ride while applying cancellation policy',
  })
  cancelRide(
    @Context() context,
    @Args('input') input: CancelRideInput,
  ): Promise<RideBooking> {
    return this.bookingService.cancelRide(this.getUserId(context), input);
  }

  @Query(() => [RideBooking], {
    description: 'Lists rides for the authenticated passenger',
  })
  myRides(
    @Context() context,
    @Args('status', { type: () => RideStatus, nullable: true }) status?: RideStatus,
  ): Promise<RideBooking[]> {
    return this.bookingService.listPassengerRides(this.getUserId(context), status);
  }

  @Query(() => RideBooking, {
    description: 'Retrieves a single ride that belongs to the passenger',
  })
  ride(@Context() context, @Args('id') id: string): Promise<RideBooking> {
    return this.bookingService.findOneForPassenger(id, this.getUserId(context));
  }

  private getUserId(context: any): string {
    return context.req.user.userId;
  }
}


