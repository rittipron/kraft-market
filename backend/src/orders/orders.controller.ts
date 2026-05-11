import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsString, IsArray, IsNumber, IsOptional, IsEnum, IsNotEmpty, ArrayMinSize, ValidateNested, Min,
} from 'class-validator';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Public, Roles } from '../common/decorators';

class OrderItemDto {
  @IsString() @IsNotEmpty() productId: string;
  @IsString() @IsNotEmpty() name: string;
  @IsNumber() @Min(0) price: number;
  @IsNumber() @Min(1) qty: number;
  @IsOptional() @IsString() image?: string;
}

class CreateOnlineOrderDto {
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsEnum(['promptpay', 'card']) paymentMethod: 'promptpay' | 'card';
  @IsOptional() @IsString() customerId?: string;
  @IsOptional() @IsString() note?: string;
  // Shipping info (stored in note for simplicity)
  @IsOptional() @IsString() shippingName?: string;
  @IsOptional() @IsString() shippingPhone?: string;
  @IsOptional() @IsString() shippingEmail?: string;
  @IsOptional() @IsString() shippingAddress?: string;
}

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // Public — any customer can place an order
  @Public()
  @Post()
  createOnlineOrder(@Body() dto: CreateOnlineOrderDto) {
    const note = dto.shippingName
      ? `ชื่อ: ${dto.shippingName} | โทร: ${dto.shippingPhone} | อีเมล: ${dto.shippingEmail} | ที่อยู่: ${dto.shippingAddress}${dto.note ? ` | หมายเหตุ: ${dto.note}` : ''}`
      : dto.note;

    return this.ordersService.create({
      items: dto.items,
      channel: 'online',
      paymentMethod: dto.paymentMethod,
      customerId: dto.customerId,
      note,
    });
  }

  @Roles('admin', 'staff')
  @Get()
  findAll(@Query() query: any) {
    return this.ordersService.findAll(query);
  }

  @Roles('admin', 'staff')
  @Get('stats/dashboard')
  getDashboardStats() {
    return this.ordersService.getDashboardStats();
  }

  @Roles('admin', 'staff')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Roles('admin', 'staff')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ordersService.updateStatus(id, status);
  }
}
