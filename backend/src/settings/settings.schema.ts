import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingsDocument = Settings & Document;

@Schema({ timestamps: true })
export class Settings {
  @Prop({ default: 'Kraft Market' }) storeName: string;
  @Prop({ default: 'ของดี ของจริง จากคนทำมือทั่วไทย' }) tagline: string;
  @Prop({ default: '' }) phone: string;
  @Prop({ default: '' }) email: string;
  @Prop({ default: '' }) address: string;
  @Prop({ default: '0800000001' }) promptpayId: string;
  @Prop({ default: '' }) facebookUrl: string;
  @Prop({ default: '' }) lineId: string;
  @Prop({ default: 7 }) vatPercent: number;
  @Prop({ default: '' }) logoUrl: string;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
