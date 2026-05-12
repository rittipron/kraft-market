import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Page, PageDocument } from './page.schema';

@Injectable()
export class PagesService {
  constructor(@InjectModel(Page.name) private pageModel: Model<PageDocument>) {}

  async findAll(status?: string) {
    const filter: any = {};
    if (status) filter.status = status;
    return this.pageModel.find(filter).sort({ createdAt: -1 }).lean();
  }

  async findBySlug(slug: string): Promise<PageDocument> {
    const page = await this.pageModel.findOne({ slug, status: 'published' }).lean();
    if (!page) throw new NotFoundException('Page not found');
    return page as unknown as PageDocument;
  }

  async findOne(id: string): Promise<PageDocument> {
    let page: PageDocument | null;
    try {
      page = await this.pageModel.findById(id).lean() as unknown as PageDocument | null;
    } catch {
      throw new NotFoundException('Page not found');
    }
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async create(data: any, authorId: string): Promise<PageDocument> {
    try {
      return await this.pageModel.create({ ...data, authorId });
    } catch (e: any) {
      if (e?.code === 11000) throw new ConflictException('Slug already exists');
      throw e;
    }
  }

  async update(id: string, data: any): Promise<PageDocument> {
    if (data.status === 'published' && !data.publishedAt) {
      data.publishedAt = new Date();
    }
    const page = await this.pageModel.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!page) throw new NotFoundException('Page not found');
    return page as unknown as PageDocument;
  }

  async remove(id: string): Promise<void> {
    const res = await this.pageModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Page not found');
  }
}
