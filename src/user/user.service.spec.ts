import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { LoginInput } from './dto/login.input';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const bcryptHashMock = bcrypt.hash as unknown as jest.Mock;
const bcryptCompareMock = bcrypt.compare as unknown as jest.Mock;

const createUserRepositoryMock = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softDelete: jest.fn(),
  find: jest.fn(),
});

type UserRepositoryMock = ReturnType<typeof createUserRepositoryMock>;

describe('UserService', () => {
  let service: UserService;
  let userRepository: UserRepositoryMock;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: createUserRepositoryMock(),
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UserService);
    userRepository = module.get<UserRepositoryMock>(getRepositoryToken(User));
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;

    jest.clearAllMocks();
    bcryptHashMock.mockResolvedValue('hashed-password');
    bcryptCompareMock.mockResolvedValue(true);
  });

  const buildCreateUserInput = (): CreateUserInput => ({
    email: 'test@example.com',
    password: 'plain-password',
    firstName: 'John',
    lastName: 'Doe',
  });

  const buildUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-id',
    email: 'test@example.com',
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

  describe('signup', () => {
    it('creates a new user when email is unused', async () => {
      const input = buildCreateUserInput();
      const createdUser = buildUser({ password: 'hashed-password' });

      userRepository.findOne.mockResolvedValue(null);
      userRepository.create.mockReturnValue(createdUser);
      userRepository.save.mockResolvedValue(createdUser);

      const result = await service.signup(input);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: input.email },
        withDeleted: true,
      });
      expect(bcryptHashMock).toHaveBeenCalledWith(input.password, 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        email: input.email,
        password: 'hashed-password',
        firstName: input.firstName,
        lastName: input.lastName,
        isConfirmed: true,
        isActive: true,
      });
      expect(userRepository.save).toHaveBeenCalledWith(createdUser);
      expect(result).toBe(createdUser);
    });

    it('restores a soft-deleted user with new details', async () => {
      const input = buildCreateUserInput();
      const softDeletedUser = buildUser({
        deletedAt: new Date(),
        isActive: false,
        firstName: 'Old',
        lastName: 'Name',
      });
      userRepository.findOne.mockResolvedValue(softDeletedUser);
      userRepository.save.mockImplementation(async (user) => user as User);

      const result = await service.signup(input);

      expect(bcryptHashMock).toHaveBeenCalledWith(input.password, 10);
      expect(userRepository.save).toHaveBeenCalledWith(softDeletedUser);
      expect(softDeletedUser.deletedAt).toBeNull();
      expect(softDeletedUser.isActive).toBe(true);
      expect(softDeletedUser.firstName).toBe(input.firstName);
      expect(softDeletedUser.lastName).toBe(input.lastName);
      expect(result).toBe(softDeletedUser);
    });

    it('throws when an active user already exists', async () => {
      userRepository.findOne.mockResolvedValue(buildUser());

      await expect(service.signup(buildCreateUserInput())).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('signin', () => {
    const loginInput: LoginInput = {
      email: 'test@example.com',
      password: 'plain-password',
    };

    it('returns token and sanitized user when credentials are valid', async () => {
      const user = buildUser();
      userRepository.findOne.mockResolvedValue(user);
      bcryptCompareMock.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('signed-token');

      const result = await service.signin(loginInput);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginInput.email },
      });
      expect(bcryptCompareMock).toHaveBeenCalledWith(
        loginInput.password,
        user.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: user.id,
        email: user.email,
      });
      expect(result.accessToken).toBe('signed-token');
      expect(result.user).toMatchObject({
        id: user.id,
        email: user.email,
      });
      expect(result.user).not.toHaveProperty('password');
    });

    it('throws UnauthorizedException when user is missing', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.signin(loginInput)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when password is invalid', async () => {
      userRepository.findOne.mockResolvedValue(buildUser());
      bcryptCompareMock.mockResolvedValue(false);

      await expect(service.signin(loginInput)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('findOne', () => {
    it('returns user without password when found', async () => {
      const user = buildUser();
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.findOne(user.id);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: user.id },
      });
      expect(result).toMatchObject({
        id: user.id,
        email: user.email,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('throws NotFoundException when user is absent', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when user is soft-deleted', async () => {
      userRepository.findOne.mockResolvedValue(
        buildUser({ deletedAt: new Date() }),
      );

      await expect(service.findOne('deleted')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByEmail', () => {
    it('returns user when active record exists', async () => {
      const user = buildUser();
      userRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail(user.email);

      expect(result).toBe(user);
    });

    it('returns null when record is missing or soft-deleted', async () => {
      userRepository.findOne.mockResolvedValue(null);
      expect(await service.findByEmail('missing@example.com')).toBeNull();

      userRepository.findOne.mockResolvedValue(
        buildUser({ deletedAt: new Date() }),
      );
      expect(await service.findByEmail('deleted@example.com')).toBeNull();
    });
  });

  describe('deleteAccount', () => {
    it('soft deletes the user and returns true', async () => {
      const user = buildUser();
      userRepository.findOne.mockResolvedValue(user);
      userRepository.softDelete.mockResolvedValue(undefined);

      const result = await service.deleteAccount(user.id);

      expect(userRepository.softDelete).toHaveBeenCalledWith(user.id);
      expect(result).toBe(true);
    });

    it('throws NotFoundException when user is missing or deleted', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(service.deleteAccount('missing')).rejects.toThrow(
        NotFoundException,
      );

      userRepository.findOne.mockResolvedValue(
        buildUser({ deletedAt: new Date() }),
      );
      await expect(service.deleteAccount('deleted')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('returns sanitized users', async () => {
      const users = [
        buildUser({ id: '1', email: 'a@example.com' }),
        buildUser({ id: '2', email: 'b@example.com' }),
      ];
      userRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(userRepository.find).toHaveBeenCalledWith({
        where: { deletedAt: null },
      });
      expect(result).toHaveLength(2);
      result.forEach((userResult) => {
        expect(userResult).not.toHaveProperty('password');
      });
    });
  });
});


