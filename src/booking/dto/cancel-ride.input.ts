import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

@InputType()
export class CancelRideInput {
  @Field()
  @IsUUID('4')
  rideId: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}


