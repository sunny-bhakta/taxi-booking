import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingService } from './booking.service';
import { BookingResolver } from './booking.resolver';
import { RideBooking } from './entities/ride-booking.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RideBooking, User])],
  providers: [BookingService, BookingResolver],
  exports: [BookingService],
})
export class BookingModule {}


