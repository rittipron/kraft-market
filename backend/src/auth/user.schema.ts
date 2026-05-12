import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ enum: ['admin', 'staff', 'customer'], default: 'customer' })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  menuPermissions: string[];

  @Prop({ default: '' })
  phone: string;

  @Prop({ default: '' })
  avatarUrl: string;

  @Prop({ default: 'local', enum: ['local', 'google', 'facebook'] })
  provider: string;

  @Prop({ default: '' })
  providerId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1 }, { unique: true });
