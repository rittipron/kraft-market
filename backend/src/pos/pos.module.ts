import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PosGateway } from './pos.gateway';
import { PosService } from './pos.service';
import { PosController } from './pos.controller';
import { OrdersModule } from '../orders/orders.module';
import { Order, OrderSchema } from '../orders/order.schema';

@Module({
  imports: [
    OrdersModule,
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  controllers: [PosController],
  providers: [PosGateway, PosService],
  exports: [PosService],
})
export class PosModule {}
