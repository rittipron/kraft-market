import {
  Body, Controller, Get, Patch, Req,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';
import { Roles } from '../common/decorators';
import { User, UserDocument } from '../auth/user.schema';
import { Order, OrderDocument } from '../orders/order.schema';

class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @IsOptional() @IsUrl({ require_tld: false }) avatarUrl?: string;
}

@Roles('customer')
@Controller('customers')
export class CustomersController {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel('Order') private orderModel: Model<any>,
  ) {}

  @Get('me')
  async getProfile(@Req() req: any) {
    const user = await this.userModel.findById(req.user.sub, '-password').lean();
    return user;
  }

  @Patch('me')
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const update: Record<string, any> = {};
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.phone !== undefined) update.phone = dto.phone;
    if (dto.avatarUrl !== undefined) update.avatarUrl = dto.avatarUrl;

    const user = await this.userModel
      .findByIdAndUpdate(req.user.sub, update, { new: true, projection: '-password' })
      .lean();
    return user;
  }

  @Get('me/orders')
  async getMyOrders(@Req() req: any) {
    return this.orderModel
      .find({ customerId: req.user.sub })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }
}
