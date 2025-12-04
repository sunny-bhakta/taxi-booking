import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class LocationPoint {
  @Field()
  address: string;

  @Field(() => Float, { nullable: true })
  latitude?: number;

  @Field(() => Float, { nullable: true })
  longitude?: number;

  @Field({ nullable: true })
  note?: string;
}


