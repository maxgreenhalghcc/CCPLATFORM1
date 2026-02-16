import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface OrderPaidPayload {
  id: string;
  barId: string;
  recipeName: string;
  status: 'paid';
  createdAt: string;
}

const ORDER_PAID_EVENT = 'order.paid';

@Injectable()
export class OrderEventsService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emitOrderPaid(payload: OrderPaidPayload): void {
    this.eventEmitter.emit(ORDER_PAID_EVENT, payload);
  }

  onOrderPaid(callback: (payload: OrderPaidPayload) => void): void {
    this.eventEmitter.on(ORDER_PAID_EVENT, callback);
  }

  offOrderPaid(callback: (payload: OrderPaidPayload) => void): void {
    this.eventEmitter.off(ORDER_PAID_EVENT, callback);
  }
}
