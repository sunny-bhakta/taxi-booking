import { Test, TestingModule } from '@nestjs/testing';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { CreateUserInput } from './dto/create-user.input';
import { LoginInput } from './dto/login.input';
import { User } from './entities/user.entity';
import { AuthResponse } from './dto/auth-response.type';

const createUserServiceMock = () => ({
  signup: jest.fn(),
  signin: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  deleteAccount: jest.fn(),
});

type UserServiceMock = ReturnType<typeof createUserServiceMock>;

const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-id',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  password: 'hashed',
  isConfirmed: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  bookings: [],
  ...overrides,
});

describe('UserResolver', () => {
  let resolver: UserResolver;
  let userService: UserServiceMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserResolver,
        {
          provide: UserService,
          useValue: createUserServiceMock(),
        },
      ],
    }).compile();

    resolver = module.get(UserResolver);
    userService = module.get(UserService) as UserServiceMock;
    jest.clearAllMocks();
  });

  it('signup delegates to the service', async () => {
    const input: CreateUserInput = {
      email: 'user@example.com',
      password: 'password',
      firstName: 'John',
      lastName: 'Doe',
    };
    const user = buildUser();
    userService.signup.mockResolvedValue(user);

    const result = await resolver.signup(input);

    expect(userService.signup).toHaveBeenCalledWith(input);
    expect(result).toBe(user);
  });

  it('signin returns the auth response from the service', async () => {
    const loginInput: LoginInput = {
      email: 'user@example.com',
      password: 'password',
    };
    const authResponse: AuthResponse = {
      accessToken: 'token',
      user: buildUser(),
    };
    userService.signin.mockResolvedValue(authResponse);

    const result = await resolver.signin(loginInput);

    expect(userService.signin).toHaveBeenCalledWith(loginInput);
    expect(result).toBe(authResponse);
  });

  it('me resolves the currently authenticated user', async () => {
    const context = { req: { user: { userId: 'current-user-id' } } };
    const user = buildUser({ id: 'current-user-id' });
    userService.findOne.mockResolvedValue(user);

    const result = await resolver.me(context);

    expect(userService.findOne).toHaveBeenCalledWith('current-user-id');
    expect(result).toBe(user);
  });

  it('user query retrieves a user by id', async () => {
    const user = buildUser({ id: 'another-id' });
    userService.findOne.mockResolvedValue(user);

    const result = await resolver.user('another-id');

    expect(userService.findOne).toHaveBeenCalledWith('another-id');
    expect(result).toBe(user);
  });

  it('users query returns all users', async () => {
    const users = [buildUser({ id: '1' }), buildUser({ id: '2' })];
    userService.findAll.mockResolvedValue(users);

    const result = await resolver.users();

    expect(userService.findAll).toHaveBeenCalled();
    expect(result).toBe(users);
  });

  it('deleteAccount delegates to the service with the current user id', async () => {
    const context = { req: { user: { userId: 'user-to-delete' } } };
    userService.deleteAccount.mockResolvedValue(true);

    const result = await resolver.deleteAccount(context);

    expect(userService.deleteAccount).toHaveBeenCalledWith('user-to-delete');
    expect(result).toBe(true);
  });
});


