import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersController } from './customers.controller';
import { User, UserSchema } from '../auth/user.schema';
import { Order, OrderSchema } from '../orders/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [CustomersController],
})
export class CustomersModule {}
