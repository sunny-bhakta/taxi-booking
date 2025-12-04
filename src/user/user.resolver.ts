import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { LoginInput } from './dto/login.input';
import { AuthResponse } from './dto/auth-response.type';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => User)
  async signup(@Args('createUserInput') createUserInput: CreateUserInput): Promise<User> {
    return this.userService.signup(createUserInput);
  }

  @Mutation(() => AuthResponse)
  async signin(@Args('loginInput') loginInput: LoginInput): Promise<AuthResponse> {
    return this.userService.signin(loginInput);
  }

  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  async me(@Context() context): Promise<User> {
    return this.userService.findOne(context.req.user.userId);
  }

  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  async user(@Args('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @Query(() => [User])
  @UseGuards(JwtAuthGuard)
  async users(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Context() context): Promise<boolean> {
    return this.userService.deleteAccount(context.req.user.userId);
  }
}

