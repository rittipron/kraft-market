import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './order.schema';

const VAT_RATE = 0.07;

function genReceiptNumber(): string {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const seq = Math.floor(Math.random() * 90000) + 10000;
  return `KRF-${date}-${seq}`;
}

@Injectable()
export class OrdersService {
  constructor(@InjectModel(Order.name) private orderModel: Model<OrderDocument>) {}

  async findAll(query: { status?: string; channel?: string; page?: number; limit?: number }) {
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.channel) filter.channel = query.channel;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.orderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.orderModel.countDocuments(filter),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id).lean();
    if (!order) throw new NotFoundException('Order not found');
    return order as unknown as OrderDocument;
  }

  async create(data: {
    items: Array<{ productId: string; name: string; price: number; qty: number; image?: string }>;
    channel: 'online' | 'pos';
    customerId?: string;
    posTerminalId?: string;
    paymentMethod: 'cash' | 'promptpay' | 'card';
    note?: string;
  }): Promise<OrderDocument> {
    const subtotal = data.items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const vat = Math.round(subtotal * VAT_RATE * 100) / 100;
    const total = Math.round((subtotal + vat) * 100) / 100;

    const order = await this.orderModel.create({
      ...data,
      subtotal,
      vat,
      total,
      status: 'pending',
      receiptNumber: genReceiptNumber(),
    });

    return order;
  }

  async updateStatus(id: string, status: string): Promise<OrderDocument> {
    const order = await this.orderModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .lean();
    if (!order) throw new NotFoundException('Order not found');
    return order as unknown as OrderDocument;
  }

  async getDashboardStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [dailySales, topProducts, statusBreakdown] = await Promise.all([
      this.orderModel.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              channel: '$channel',
            },
            total: { $sum: '$total' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.date': 1 } },
      ]),

      this.orderModel.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            name: { $first: '$items.name' },
            sold: { $sum: '$items.qty' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
          },
        },
        { $sort: { sold: -1 } },
        { $limit: 5 },
      ]),

      this.orderModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    return { dailySales, topProducts, statusBreakdown };
  }
}
