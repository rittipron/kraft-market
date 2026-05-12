import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NavItemDocument = NavItem & Document;

@Schema({ timestamps: true })
export class NavItem {
  @Prop({ required: true, trim: true })
  label: string;

  @Prop({ enum: ['url', 'page', 'category'], default: 'url' })
  type: string;

  @Prop({ trim: true })
  url: string;

  @Prop({ type: Types.ObjectId, ref: 'Page' })
  pageId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category' })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'NavItem', default: null })
  parentId: Types.ObjectId;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isVisible: boolean;

  @Prop({ default: false })
  openInNewTab: boolean;
}

export const NavItemSchema = SchemaFactory.createForClass(NavItem);
NavItemSchema.index({ order: 1 });
NavItemSchema.index({ parentId: 1 });
