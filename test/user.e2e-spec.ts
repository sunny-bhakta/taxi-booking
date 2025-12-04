import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { join } from 'path';
import { User } from '../src/user/entities/user.entity';
import { RideBooking } from '../src/booking/entities/ride-booking.entity';
import { UserModule } from '../src/user/user.module';
import { AuthModule } from '../src/auth/auth.module';

jest.setTimeout(30000);

describe('UserModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        GraphQLModule.forRoot<ApolloFederationDriverConfig>({
          driver: ApolloFederationDriver,
          autoSchemaFile: {
            path: join(process.cwd(), 'src/schema.gql'),
            federation: {
              version: 2,
            },
          },
          sortSchema: true,
          context: ({ req }) => ({ req }),
          buildSchemaOptions: {
            numberScalarMode: 'integer',
          },
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          dropSchema: true,
          entities: [User, RideBooking],
          synchronize: true,
          logging: false,
        }),
        UserModule,
        AuthModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('signs up, signs in, and fetches protected data', async () => {
    const signupMutation = `
      mutation Signup($input: CreateUserInput!) {
        signup(createUserInput: $input) {
          id
          email
          firstName
          lastName
          isConfirmed
          isActive
        }
      }
    `;

    const signinMutation = `
      mutation Signin($input: LoginInput!) {
        signin(loginInput: $input) {
          accessToken
          user {
            id
            email
          }
        }
      }
    `;

    const meQuery = `
      query Me {
        me {
          id
          email
          firstName
          lastName
        }
      }
    `;

    const usersQuery = `
      query Users {
        users {
          id
          email
        }
      }
    `;

    const createUserInput = {
      email: 'e2e-user@example.com',
      password: 'securePass123',
      firstName: 'E2E',
      lastName: 'User',
    };

    const signupResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: signupMutation,
        variables: { input: createUserInput },
      })
      .expect(200);

    expect(signupResponse.body.errors).toBeUndefined();
    expect(signupResponse.body.data.signup.email).toBe(createUserInput.email);
    expect(signupResponse.body.data.signup.isConfirmed).toBe(true);

    const signinResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: signinMutation,
        variables: { input: { email: createUserInput.email, password: createUserInput.password } },
      })
      .expect(200);

    expect(signinResponse.body.errors).toBeUndefined();
    const { accessToken, user } = signinResponse.body.data.signin;
    expect(accessToken).toBeDefined();
    expect(user.email).toBe(createUserInput.email);

    const meResponse = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ query: meQuery })
      .expect(200);

    expect(meResponse.body.errors).toBeUndefined();
    expect(meResponse.body.data.me.email).toBe(createUserInput.email);

    const usersResponse = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ query: usersQuery })
      .expect(200);

    expect(usersResponse.body.errors).toBeUndefined();
    expect(usersResponse.body.data.users).toHaveLength(1);
    expect(usersResponse.body.data.users[0].email).toBe(createUserInput.email);
  });
});


