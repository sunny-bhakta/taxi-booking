import { Field, Float, InputType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

@InputType()
export class LocationInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  note?: string;
}


