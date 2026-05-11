import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../orders/order.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../common/decorators';

@Controller('pos')
export class PosController {
  constructor(@InjectModel(Order.name) private orderModel: Model<OrderDocument>) {}

  @UseGuards(JwtAuthGuard)
  @Get('receipt/:orderId')
  async getReceipt(@Param('orderId') orderId: string, @Res() res: Response) {
    const order = await this.orderModel.findById(orderId).lean() as any;
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const paymentLabels: Record<string, string> = {
      cash: 'เงินสด',
      promptpay: 'พร้อมเพย์',
      card: 'บัตรเครดิต',
    };

    const receiptHtml = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>ใบเสร็จ ${order.receiptNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Sarabun', 'Anuphan', sans-serif; font-size: 12px; width: 80mm; padding: 8mm; color: #1a1a1a; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .large { font-size: 16px; }
    .divider { border-top: 1px dashed #999; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; margin: 3px 0; }
    .total-row { font-size: 14px; font-weight: bold; }
    .footer { text-align: center; margin-top: 10px; font-size: 10px; color: #666; }
    @media print { body { width: 80mm; } }
  </style>
</head>
<body>
  <div class="center bold large">Kraft Market</div>
  <div class="center" style="font-size:10px; color:#666; margin-bottom:8px;">ของดี ของจริง จากคนทำมือทั่วไทย</div>
  <div class="divider"></div>
  <div class="row"><span>เลขที่</span><span class="bold">${order.receiptNumber}</span></div>
  <div class="row"><span>วันที่</span><span>${new Date(order.createdAt).toLocaleString('th-TH')}</span></div>
  <div class="row"><span>ช่องทาง</span><span>${order.channel === 'pos' ? 'หน้าร้าน' : 'ออนไลน์'}</span></div>
  <div class="divider"></div>
  <div class="bold" style="margin-bottom:4px;">รายการสินค้า</div>
  ${order.items.map((item: any) => `
    <div>${item.name}</div>
    <div class="row" style="color:#666; padding-left:8px;">
      <span>${item.qty} × ฿${item.price.toLocaleString()}</span>
      <span>฿${(item.qty * item.price).toLocaleString()}</span>
    </div>
  `).join('')}
  <div class="divider"></div>
  <div class="row"><span>ยอดรวม</span><span>฿${order.subtotal?.toLocaleString()}</span></div>
  <div class="row"><span>VAT 7%</span><span>฿${order.vat?.toLocaleString()}</span></div>
  <div class="divider"></div>
  <div class="row total-row"><span>รวมทั้งหมด</span><span>฿${order.total.toLocaleString()}</span></div>
  <div class="row" style="margin-top:4px;"><span>วิธีชำระ</span><span>${paymentLabels[order.paymentMethod] || order.paymentMethod}</span></div>
  <div class="footer">
    <div class="divider"></div>
    <div>ขอบคุณที่ใช้บริการ</div>
    <div>www.kraftmarket.com</div>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(receiptHtml);
  }
}
