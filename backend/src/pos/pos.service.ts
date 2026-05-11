import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/redis.module';
import { OrdersService } from '../orders/orders.service';

const CART_TTL = 4 * 60 * 60; // 4 hours

interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
}

const DECREMENT_STOCK_LUA = `
  local stock = tonumber(redis.call('GET', KEYS[1]))
  if stock == nil then return -1 end
  if stock < tonumber(ARGV[1]) then return 0 end
  return redis.call('DECRBY', KEYS[1], ARGV[1])
`;

@Injectable()
export class PosService {
  constructor(
    @Inject(REDIS_CLIENT) private redis: Redis,
    private ordersService: OrdersService,
  ) {}

  private cartKey(terminalId: string) {
    return `pos:cart:${terminalId}`;
  }

  async openTerminal(terminalId: string, staffId: string) {
    const key = `pos:terminal:${terminalId}`;
    await this.redis.set(key, JSON.stringify({ staffId, openedAt: new Date().toISOString(), shiftTotal: 0 }));
    const cart = await this.getCart(terminalId);
    return cart;
  }

  async getCart(terminalId: string) {
    const raw = await this.redis.hgetall(this.cartKey(terminalId));
    const items: CartItem[] = Object.values(raw).map((v) => JSON.parse(v));
    return this.computeTotals(items);
  }

  async addItem(terminalId: string, item: CartItem) {
    const existing = await this.redis.hget(this.cartKey(terminalId), item.productId);
    if (existing) {
      const current = JSON.parse(existing) as CartItem;
      item.qty = current.qty + item.qty;
    }
    await this.redis.hset(this.cartKey(terminalId), item.productId, JSON.stringify(item));
    await this.redis.expire(this.cartKey(terminalId), CART_TTL);
    return this.getCart(terminalId);
  }

  async removeItem(terminalId: string, productId: string) {
    await this.redis.hdel(this.cartKey(terminalId), productId);
    return this.getCart(terminalId);
  }

  async clearCart(terminalId: string) {
    await this.redis.del(this.cartKey(terminalId));
    return { items: [], subtotal: 0, vat: 0, total: 0 };
  }

  async checkout(terminalId: string, paymentMethod: 'cash' | 'promptpay' | 'card', staffId?: string) {
    const { items } = await this.getCart(terminalId);
    if (!items.length) throw new Error('Cart is empty');

    for (const item of items) {
      const result = await this.redis.eval(
        DECREMENT_STOCK_LUA,
        1,
        `stock:${item.productId}`,
        item.qty,
      ) as number;
      if (result === 0) throw new Error(`สินค้า "${item.name}" สต็อกไม่พอ`);
      if (result === -1) throw new Error(`ไม่พบสต็อกสินค้า "${item.name}"`);

      if (result < 5) {
        await this.redis.publish('stock:alert', JSON.stringify({ productId: item.productId, remaining: result }));
      }
    }

    const order = await this.ordersService.create({
      items,
      channel: 'pos',
      posTerminalId: terminalId,
      paymentMethod,
    });

    await this.clearCart(terminalId);

    const termKey = `pos:terminal:${terminalId}`;
    const termData = await this.redis.get(termKey);
    if (termData) {
      const term = JSON.parse(termData);
      term.shiftTotal = (term.shiftTotal || 0) + order.total;
      await this.redis.set(termKey, JSON.stringify(term));
    }

    return order;
  }

  private computeTotals(items: CartItem[]) {
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const vat = Math.round(subtotal * 0.07 * 100) / 100;
    const total = Math.round((subtotal + vat) * 100) / 100;
    return { items, subtotal, vat, total };
  }
}
