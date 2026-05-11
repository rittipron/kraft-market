import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PosService } from './pos.service';

@WebSocketGateway({ namespace: 'pos', cors: { origin: '*' } })
export class PosGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private posService: PosService) {}

  handleConnection(client: Socket) {
    console.log(`[POS] terminal connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[POS] terminal disconnected: ${client.id}`);
  }

  @SubscribeMessage('terminal:open')
  async handleOpen(
    @MessageBody() data: { terminalId: string; staffId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`terminal:${data.terminalId}`);
    const cart = await this.posService.openTerminal(data.terminalId, data.staffId);
    client.emit('cart:loaded', cart);
  }

  @SubscribeMessage('cart:add')
  async handleCartAdd(
    @MessageBody() data: { terminalId: string; productId: string; name: string; price: number; qty: number; image?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const cart = await this.posService.addItem(data.terminalId, {
      productId: data.productId,
      name: data.name,
      price: data.price,
      qty: data.qty,
      image: data.image,
    });
    this.server.to(`terminal:${data.terminalId}`).emit('cart:updated', cart);
  }

  @SubscribeMessage('cart:remove')
  async handleCartRemove(
    @MessageBody() data: { terminalId: string; productId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const cart = await this.posService.removeItem(data.terminalId, data.productId);
    this.server.to(`terminal:${data.terminalId}`).emit('cart:updated', cart);
  }

  @SubscribeMessage('cart:clear')
  async handleCartClear(
    @MessageBody() data: { terminalId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const cart = await this.posService.clearCart(data.terminalId);
    this.server.to(`terminal:${data.terminalId}`).emit('cart:cleared', cart);
  }

  @SubscribeMessage('payment:confirm')
  async handlePaymentConfirm(
    @MessageBody() data: { terminalId: string; method: 'cash' | 'promptpay' | 'card' },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(`terminal:${data.terminalId}`).emit('payment:processing', {});
    try {
      const order = await this.posService.checkout(data.terminalId, data.method);
      this.server.to(`terminal:${data.terminalId}`).emit('payment:success', {
        orderId: order._id,
        receiptNumber: (order as any).receiptNumber,
        total: (order as any).total,
      });
    } catch (err: any) {
      this.server.to(`terminal:${data.terminalId}`).emit('payment:failed', {
        reason: err.message,
      });
    }
  }
}
