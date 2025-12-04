import { ObjectType, Field, ID, Float, GraphQLISODateTime } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { VehicleType } from '../enums/vehicle-type.enum';
import { RideStatus } from '../enums/ride-status.enum';
import { LocationPoint } from '../models/location-point.model';

@ObjectType()
@Entity('ride_bookings')
export class RideBooking {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.bookings, {
    eager: true,
    nullable: false,
  })
  passenger: User;

  @Field(() => LocationPoint)
  @Column({ type: 'simple-json' })
  pickupLocation: LocationPoint;

  @Field(() => LocationPoint)
  @Column({ type: 'simple-json' })
  destinationLocation: LocationPoint;

  @Field(() => [LocationPoint], { nullable: true })
  @Column({ type: 'simple-json', nullable: true })
  stops?: LocationPoint[];

  @Field(() => VehicleType)
  @Column({ type: 'text' })
  vehicleType: VehicleType;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  note?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @Column({ type: 'datetime', nullable: true })
  scheduledAt?: Date | null;

  @Field(() => Boolean)
  @Column({ default: true })
  isInstant: boolean;

  @Field(() => RideStatus)
  @Column({ type: 'text', default: RideStatus.PENDING_DRIVER })
  status: RideStatus;

  @Field(() => Float)
  @Column({ type: 'float' })
  estimatedFare: number;

  @Field(() => Float)
  @Column({ type: 'float' })
  estimatedDistanceKm: number;

  @Field(() => Float)
  @Column({ type: 'float' })
  estimatedDurationMinutes: number;

  @Field(() => GraphQLISODateTime)
  @Column({ type: 'datetime' })
  estimatedArrival: Date;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', nullable: true })
  cancellationPenalty?: number;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  @Field({ nullable: true })
  @Column({ type: 'int', nullable: true })
  cancellationWindowMinutes?: number;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @Column({ type: 'datetime', nullable: true })
  cancelledAt?: Date;

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  @UpdateDateColumn()
  updatedAt: Date;
}


