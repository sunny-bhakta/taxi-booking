import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field()
  @IsString()
  @IsNotEmpty()  @MinLength(2)
  firstName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  lastName: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
