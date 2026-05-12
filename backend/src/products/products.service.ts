import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { createHash } from 'crypto';
import type Redis from 'ioredis';
import { Product, ProductDocument } from './product.schema';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './product.dto';
import { REDIS_CLIENT } from '../common/redis.module';

const CACHE_TTL = 300; // 5 minutes

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async findAll(query: ProductQueryDto) {
    const cacheKey = `cache:products:${createHash('md5').update(JSON.stringify(query)).digest('hex')}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const filter: FilterQuery<ProductDocument> = {};
    if (query.search) filter.$text = { $search: query.search };
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.status) filter.status = query.status;
    else filter.status = 'active';

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.productModel.find(filter).skip(skip).limit(limit).lean(),
      this.productModel.countDocuments(filter),
    ]);

    const result = { items, total, page, limit, pages: Math.ceil(total / limit) };
    await this.redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    return result;
  }

  async findOne(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).lean();
    if (!product) throw new NotFoundException('Product not found');
    return product as unknown as ProductDocument;
  }

  async create(dto: CreateProductDto): Promise<ProductDocument> {
    try {
      const product = await this.productModel.create(dto);
      await this.invalidateCache();
      await this.syncStock(product._id.toString(), product.stock);
      return product;
    } catch (e: any) {
      if (e?.code === 11000) throw new ConflictException('SKU already exists');
      throw e;
    }
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDocument> {
    const product = await this.productModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .lean();
    if (!product) throw new NotFoundException('Product not found');
    await this.invalidateCache();
    if (dto.stock !== undefined) {
      await this.syncStock(id, dto.stock);
    }
    return product as unknown as ProductDocument;
  }

  async remove(id: string): Promise<void> {
    const res = await this.productModel.findByIdAndDelete(id);
    if (!res) throw new NotFoundException('Product not found');
    await this.invalidateCache();
    await this.redis.del(`stock:${id}`);
  }

  private async invalidateCache(): Promise<void> {
    const stream = this.redis.scanStream({ match: 'cache:products:*', count: 100 });
    const pipeline = this.redis.pipeline();
    await new Promise<void>((resolve, reject) => {
      stream.on('data', (keys: string[]) => keys.forEach((k) => pipeline.del(k)));
      stream.on('end', resolve);
      stream.on('error', reject);
    });
    await pipeline.exec();
  }

  private async syncStock(productId: string, stock: number): Promise<void> {
    await this.redis.set(`stock:${productId}`, stock.toString());
  }

  async getStock(productId: string): Promise<number> {
    const val = await this.redis.get(`stock:${productId}`);
    if (val !== null) return parseInt(val, 10);
    const product = await this.productModel.findById(productId).select('stock').lean();
    return product ? (product as any).stock : 0;
  }
}
