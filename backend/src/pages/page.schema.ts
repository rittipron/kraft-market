import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PageDocument = Page & Document;

@Schema({ _id: false })
class PageBlock {
  @Prop({ required: true }) id: string;
  @Prop({ required: true, enum: ['hero', 'heading', 'text', 'image', 'products', 'cta', 'columns', 'testimonials'] })
  type: string;
  @Prop({ type: Object }) data: Record<string, any>;
  @Prop({ default: 0 }) order: number;
}
const PageBlockSchema = SchemaFactory.createForClass(PageBlock);

@Schema({ timestamps: true })
export class Page {

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ enum: ['draft', 'published', 'scheduled'], default: 'draft' })
  status: string;

  @Prop({ type: [PageBlockSchema], default: [] })
  blocks: PageBlock[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  authorId: Types.ObjectId;

  @Prop()
  publishedAt: Date;

  @Prop()
  scheduledAt: Date;
}

export const PageSchema = SchemaFactory.createForClass(Page);
PageSchema.index({ slug: 1 }, { unique: true });
PageSchema.index({ status: 1 });

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// pre('validate') runs before Mongoose required-field check, so slug gets generated first
PageSchema.pre('validate', function (next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title) || `page-${Date.now()}`;
  }
  next();
});
