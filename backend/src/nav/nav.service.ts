import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NavItem, NavItemDocument } from './nav.schema';

@Injectable()
export class NavService {
  constructor(@InjectModel(NavItem.name) private navModel: Model<NavItemDocument>) {}

  async findAll(): Promise<NavItemDocument[]> {
    return this.navModel.find().sort({ order: 1 }).lean() as unknown as NavItemDocument[];
  }

  async findPublic(): Promise<NavItemDocument[]> {
    return this.navModel.find({ isVisible: true }).sort({ order: 1 }).lean() as unknown as NavItemDocument[];
  }

  async create(data: Partial<NavItem>): Promise<NavItemDocument> {
    const count = await this.navModel.countDocuments({ parentId: data.parentId ?? null });
    return this.navModel.create({ ...data, order: data.order ?? count });
  }

  async update(id: string, data: Partial<NavItem>): Promise<NavItemDocument> {
    let item: NavItemDocument | null;
    try {
      item = await this.navModel.findByIdAndUpdate(id, data, { new: true }).lean() as unknown as NavItemDocument | null;
    } catch {
      throw new NotFoundException('Nav item not found');
    }
    if (!item) throw new NotFoundException('Nav item not found');
    return item;
  }

  async remove(id: string): Promise<void> {
    let res: any;
    try {
      res = await this.navModel.findByIdAndDelete(id);
    } catch {
      throw new NotFoundException('Nav item not found');
    }
    if (!res) throw new NotFoundException('Nav item not found');
    // also remove children
    await this.navModel.deleteMany({ parentId: id });
  }

  async reorder(items: { id: string; order: number }[]): Promise<void> {
    await Promise.all(
      items.map(({ id, order }) => this.navModel.findByIdAndUpdate(id, { order }).catch(() => null)),
    );
  }
}
