import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RideBooking } from './entities/ride-booking.entity';
import { User } from '../user/entities/user.entity';
import { CreateRideBookingInput } from './dto/create-ride-booking.input';
import { RideStatus } from './enums/ride-status.enum';
import { VehicleType } from './enums/vehicle-type.enum';
import { CancelRideInput } from './dto/cancel-ride.input';
import { LocationPoint } from './models/location-point.model';

type RoutePoint = Pick<LocationPoint, 'latitude' | 'longitude'>;

@Injectable()
export class BookingService {
  private static readonly DEFAULT_SEGMENT_DISTANCE_KM = 3;
  private static readonly AVERAGE_SPEED_KMH = 32;

  private readonly pricingMatrix: Record<
    VehicleType,
    { base: number; perKm: number; perMinute: number }
  > = {
    [VehicleType.ECONOMY]: { base: 2.5, perKm: 0.85, perMinute: 0.3 },
    [VehicleType.PREMIUM]: { base: 4, perKm: 1.15, perMinute: 0.42 },
    [VehicleType.SUV]: { base: 4.5, perKm: 1.3, perMinute: 0.48 },
    [VehicleType.EXECUTIVE]: { base: 6, perKm: 1.6, perMinute: 0.6 },
  };

  constructor(
    @InjectRepository(RideBooking)
    private readonly bookingRepository: Repository<RideBooking>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createRideBooking(
    passengerId: string,
    input: CreateRideBookingInput,
  ): Promise<RideBooking> {
    const passenger = await this.userRepository.findOne({
      where: { id: passengerId },
    });

    console.log(passenger, ".......passenger...........");
    if (!passenger || passenger.deletedAt) {
      throw new NotFoundException('Passenger not found');
    }

    if (!passenger.isActive) {
      throw new BadRequestException('Passenger account is inactive');
    }

    const stops = input.stops ?? [];
    const isScheduledRide = Boolean(
      input.scheduledAt && this.isFutureDate(input.scheduledAt, 5),
    );

    const routePoints: LocationPoint[] = [input.pickup, ...stops, input.destination];
    const estimatedDistanceKm = this.resolveDistance(routePoints, input.estimatedDistanceKm);
    const estimatedDurationMinutes = this.resolveDuration(
      estimatedDistanceKm,
      input.estimatedDurationMinutes,
    );
    const estimatedFare = this.calculateFare(
      input.vehicleType,
      estimatedDistanceKm,
      estimatedDurationMinutes,
      stops.length,
      isScheduledRide,
    );
    const estimatedArrival = this.estimateArrivalTime(input.scheduledAt, estimatedDurationMinutes);
    const cancellationWindowMinutes = this.getCancellationWindowMinutes(isScheduledRide);

    const booking = this.bookingRepository.create({
      passenger,
      pickupLocation: input.pickup,
      destinationLocation: input.destination,
      stops: stops.length ? stops : null,
      vehicleType: input.vehicleType,
      note: input.note ?? null,
      scheduledAt: input.scheduledAt ?? null,
      isInstant: !isScheduledRide,
      status: isScheduledRide ? RideStatus.SCHEDULED : RideStatus.PENDING_DRIVER,
      estimatedFare,
      estimatedDistanceKm,
      estimatedDurationMinutes,
      estimatedArrival,
      cancellationWindowMinutes,
    });

    return this.bookingRepository.save(booking);
  }

  async findOneForPassenger(rideId: string, passengerId: string): Promise<RideBooking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: rideId },
    });

    if (!booking || booking.passenger.id !== passengerId) {
      throw new NotFoundException('Ride not found');
    }

    return booking;
  }

  async listPassengerRides(passengerId: string, status?: RideStatus): Promise<RideBooking[]> {
    const query = this.bookingRepository
      .createQueryBuilder('ride')
      .leftJoinAndSelect('ride.passenger', 'passenger')
      .where('passenger.id = :passengerId', { passengerId })
      .orderBy('ride.createdAt', 'DESC');

    if (status) {
      query.andWhere('ride.status = :status', { status });
    }

    return query.getMany();
  }

  async cancelRide(passengerId: string, input: CancelRideInput): Promise<RideBooking> {
    const booking = await this.findOneForPassenger(input.rideId, passengerId);

    if ([RideStatus.CANCELLED, RideStatus.COMPLETED].includes(booking.status)) {
      throw new BadRequestException('Ride can no longer be cancelled');
    }

    const penalty = this.calculateCancellationPenalty(booking);

    booking.status = RideStatus.CANCELLED;
    booking.cancellationReason = input.reason ?? null;
    booking.cancellationPenalty = penalty;
    booking.cancelledAt = new Date();

    return this.bookingRepository.save(booking);
  }

  private resolveDistance(points: LocationPoint[], manualDistance?: number): number {
    if (manualDistance && manualDistance > 0) {
      return Number(manualDistance.toFixed(2));
    }
    const calculated = this.calculateRouteDistance(points);
    return Number(Math.max(calculated, 1).toFixed(2));
  }

  private resolveDuration(distanceKm: number, manualDuration?: number): number {
    if (manualDuration && manualDuration > 0) {
      return Number(manualDuration.toFixed(0));
    }
    const duration = (distanceKm / BookingService.AVERAGE_SPEED_KMH) * 60;
    return Math.max(10, Math.round(duration));
  }

  private calculateFare(
    vehicleType: VehicleType,
    distanceKm: number,
    durationMinutes: number,
    stopCount: number,
    isScheduledRide: boolean,
  ): number {
    const pricing = this.pricingMatrix[vehicleType];
    const stopFee = stopCount * 1.25;
    const scheduledFee = isScheduledRide ? 1.5 : 0;

    const fare =
      pricing.base +
      pricing.perKm * distanceKm +
      pricing.perMinute * durationMinutes +
      stopFee +
      scheduledFee;

    return Number(fare.toFixed(2));
  }

  private estimateArrivalTime(scheduledAt: Date | null | undefined, durationMinutes: number): Date {
    const base =
      scheduledAt && scheduledAt > new Date()
        ? scheduledAt
        : new Date();

    return new Date(base.getTime() + durationMinutes * 60 * 1000);
  }

  private getCancellationWindowMinutes(isScheduledRide: boolean): number {
    return isScheduledRide ? 30 : 5;
  }

  private calculateCancellationPenalty(booking: RideBooking): number {
    const pickupReference = booking.isInstant
      ? booking.createdAt
      : booking.scheduledAt ?? booking.createdAt;
    const minutesUntilPickup =
      (pickupReference.getTime() - Date.now()) / (1000 * 60);
    const window = booking.cancellationWindowMinutes ?? this.getCancellationWindowMinutes(!booking.isInstant);

    if (minutesUntilPickup >= window) {
      return 0;
    }

    const penalty = Math.max(5, booking.estimatedFare * 0.15);
    return Number(penalty.toFixed(2));
  }

  private isFutureDate(date: Date, minutesAhead: number): boolean {
    const now = Date.now();
    return date.getTime() - now > minutesAhead * 60 * 1000;
  }

  private calculateRouteDistance(points: RoutePoint[]): number {
    if (points.length < 2) {
      return BookingService.DEFAULT_SEGMENT_DISTANCE_KM;
    }

    let distance = 0;
    for (let i = 0; i < points.length - 1; i += 1) {
      distance += this.segmentDistance(points[i], points[i + 1]);
    }
    return distance;
  }

  private segmentDistance(from: RoutePoint, to: RoutePoint): number {
    if (this.hasCoordinates(from) && this.hasCoordinates(to)) {
      const earthRadiusKm = 6371;
      const dLat = this.deg2rad(to.latitude - from.latitude);
      const dLon = this.deg2rad(to.longitude - from.longitude);
      const lat1 = this.deg2rad(from.latitude);
      const lat2 = this.deg2rad(to.latitude);

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return +(earthRadiusKm * c).toFixed(2);
    }

    return BookingService.DEFAULT_SEGMENT_DISTANCE_KM;
  }

  private hasCoordinates(point: RoutePoint): point is Required<RoutePoint> {
    return typeof point.latitude === 'number' && typeof point.longitude === 'number';
  }

  private deg2rad(value: number): number {
    return (value * Math.PI) / 180;
  }
}


