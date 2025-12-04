import { Injectable, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { LoginInput } from './dto/login.input';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async signup(createUserInput: CreateUserInput): Promise<User> {
    const { email, password, firstName, lastName } = createUserInput;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
      withDeleted: true,
    });

    if (existingUser) {
      if (existingUser.deletedAt) {
        // Restore soft-deleted user
        existingUser.deletedAt = null;
        existingUser.isActive = true;
        existingUser.password = await bcrypt.hash(password, 10);
        existingUser.firstName = firstName;
        existingUser.lastName = lastName;
        return await this.userRepository.save(existingUser);
      }
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user (confirmed by default)
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      isConfirmed: true, // User is confirmed by default
      isActive: true,
    });

    return await this.userRepository.save(user);
  }

  async signin(loginInput: LoginInput): Promise<{ accessToken: string; user: User }> {
    const { email, password } = loginInput;

    // Find user (including soft-deleted)
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      user: userWithoutPassword as User,
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user || user.deletedAt) {
      return null;
    }

    return user;
  }

  async deleteAccount(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    // Soft delete the user
    await this.userRepository.softDelete(userId);
    return true;
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find({
      where: { deletedAt: null },
    });

    return users.map(({ password: _, ...user }) => user as User);
  }
}

