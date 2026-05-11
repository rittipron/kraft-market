import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ _id: false })
class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true }) name: string;
  @Prop({ required: true, min: 0 }) price: number;
  @Prop({ required: true, min: 1 }) qty: number;
  @Prop() image: string;
}
const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class Order {

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true, min: 0 }) subtotal: number;
  @Prop({ default: 0, min: 0 }) vat: number;
  @Prop({ required: true, min: 0 }) total: number;

  @Prop({ enum: ['pending', 'paid', 'shipped', 'completed', 'cancelled'], default: 'pending' })
  status: string;

  @Prop({ enum: ['online', 'pos'], required: true })
  channel: string;

  @Prop({ type: Types.ObjectId, ref: 'Customer' })
  customerId: Types.ObjectId;

  @Prop()
  posTerminalId: string;

  @Prop({ enum: ['cash', 'promptpay', 'card'] })
  paymentMethod: string;

  @Prop({ unique: true, sparse: true })
  receiptNumber: string;

  @Prop()
  note: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ customerId: 1 });
