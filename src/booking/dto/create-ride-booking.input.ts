import { Field, Float, GraphQLISODateTime, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmptyObject,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { LocationInput } from './location.input';
import { VehicleType } from '../enums/vehicle-type.enum';

@InputType()
export class CreateRideBookingInput {
  @Field(() => LocationInput)
  @ValidateNested()
  @Type(() => LocationInput)
  @IsNotEmptyObject()
  pickup: LocationInput;

  @Field(() => LocationInput)
  @ValidateNested()
  @Type(() => LocationInput)
  @IsNotEmptyObject()
  destination: LocationInput;

  @Field(() => [LocationInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationInput)
  stops?: LocationInput[];

  @Field(() => VehicleType)
  @IsEnum(VehicleType)
  vehicleType: VehicleType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledAt?: Date;

  @Field(() => Float, { nullable: true, description: 'Optional manual override for total distance in km' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  estimatedDistanceKm?: number;

  @Field(() => Float, { nullable: true, description: 'Optional manual override for total duration in minutes' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  estimatedDurationMinutes?: number;
}


