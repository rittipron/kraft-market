import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StaffController } from './staff.controller';
import { User, UserSchema } from '../auth/user.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [StaffController],
})
export class StaffModule {}
