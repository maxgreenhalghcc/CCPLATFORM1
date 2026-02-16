import {
  Controller,
  ForbiddenException,
  Param,
  Req,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserRole } from '@prisma/client';

import { ApiAuthGuard } from '../common/guards/api-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { OrderEventsService, OrderPaidPayload } from './order-events.service';

interface MessageEvent {
  data: string | object;
  type?: string;
}

@UseGuards(ApiAuthGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.staff)
@Controller('bars')
export class OrdersSseController {
  constructor(private readonly orderEvents: OrderEventsService) {}

  @Sse(':id/orders/stream')
  stream(
    @Param('id') barId: string,
    @Req() request: AuthenticatedRequest,
  ): Observable<MessageEvent> {
    const user = request.user;

    // Staff can only stream their own bar; admins can stream any bar
    if (user?.role !== 'admin' && user?.barId !== barId) {
      throw new ForbiddenException('You can only stream orders for your own bar');
    }

    return new Observable<MessageEvent>((subscriber) => {
      const handler = (payload: OrderPaidPayload) => {
        if (payload.barId === barId) {
          subscriber.next({ data: payload });
        }
      };

      this.orderEvents.onOrderPaid(handler);

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        subscriber.next({ type: 'ping', data: '' });
      }, 30_000);

      // Cleanup on disconnect
      return () => {
        clearInterval(heartbeat);
        this.orderEvents.offOrderPaid(handler);
      };
    });
  }
}
