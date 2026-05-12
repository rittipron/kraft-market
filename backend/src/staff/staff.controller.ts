import {
  Body, Controller, Delete, Get, Param, Patch, Post,
  NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { IsString, IsEmail, IsOptional, IsBoolean, IsArray, MinLength } from 'class-validator';
import { Roles } from '../common/decorators';
import { User, UserDocument } from '../auth/user.schema';

class CreateStaffDto {
  @IsEmail() email: string;
  @IsString() @MinLength(2) name: string;
  @IsString() @MinLength(6) password: string;
  @IsOptional() @IsArray() menuPermissions?: string[];
}

class UpdateStaffDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MinLength(6) password?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

class UpdatePermissionsDto {
  @IsArray() menuPermissions: string[];
}

@Roles('admin')
@Controller('staff')
export class StaffController {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  @Get()
  async list() {
    return this.userModel
      .find({ role: 'staff' }, '-password')
      .sort({ createdAt: -1 })
      .lean();
  }

  @Post()
  async create(@Body() dto: CreateStaffDto) {
    const exists = await this.userModel.findOne({ email: dto.email }).lean();
    if (exists) throw new ConflictException('Email already registered');
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.userModel.create({
      email: dto.email,
      name: dto.name,
      password: hashed,
      role: 'staff',
      menuPermissions: dto.menuPermissions ?? [],
    });
    const { password: _, ...safe } = user.toObject();
    return safe;
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    const update: Record<string, any> = {};
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.email !== undefined) update.email = dto.email;
    if (dto.isActive !== undefined) update.isActive = dto.isActive;
    if (dto.password) update.password = await bcrypt.hash(dto.password, 10);

    const user = await this.userModel
      .findOneAndUpdate({ _id: id, role: 'staff' }, update, { new: true, projection: '-password' })
      .lean();
    if (!user) throw new NotFoundException('Staff not found');
    return user;
  }

  @Patch(':id/permissions')
  async updatePermissions(@Param('id') id: string, @Body() dto: UpdatePermissionsDto) {
    const user = await this.userModel
      .findOneAndUpdate(
        { _id: id, role: 'staff' },
        { menuPermissions: dto.menuPermissions },
        { new: true, projection: '-password' },
      )
      .lean();
    if (!user) throw new NotFoundException('Staff not found');
    return user;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const user = await this.userModel.findOneAndDelete({ _id: id, role: 'staff' });
    if (!user) throw new NotFoundException('Staff not found');
    return { success: true };
  }
}
