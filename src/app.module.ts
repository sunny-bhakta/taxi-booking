import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { BookingModule } from './booking/booking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        path: join(process.cwd(), 'src/schema.gql'),
        federation: {
          version: 2,
        },
      },
      sortSchema: true,
      introspection: true,
      context: ({ req }) => ({ req }),
      buildSchemaOptions: {
        numberScalarMode: 'integer',
      },
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env.DB_PATH || 'taxi_booking.db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: true,
    }),
    UserModule,
    AuthModule,
    BookingModule,
  ],
})
export class AppModule {}

