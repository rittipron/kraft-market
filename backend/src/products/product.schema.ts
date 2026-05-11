import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {

  @Prop({ required: true, minlength: 2, trim: true })
  name: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ unique: true })
  sku: string;

  @Prop({ default: 0, min: 0 })
  stock: number;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Shop' })
  shopId: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ enum: ['active', 'draft', 'archived'], default: 'active' })
  status: string;

  @Prop({ default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ default: 0 })
  soldCount: number;

  @Prop({ trim: true })
  description: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ status: 1, categoryId: 1 });
ProductSchema.index({ name: 'text', tags: 'text' });
ProductSchema.index({ sku: 1 }, { unique: true });

ProductSchema.pre('save', function (next) {
  if (!this.sku) {
    this.sku = `KRF-${Date.now()}`;
  }
  next();
});
