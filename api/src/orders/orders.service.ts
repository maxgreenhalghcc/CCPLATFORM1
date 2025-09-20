import { Injectable } from '@nestjs/common';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Injectable()
export class OrdersService {
  createCheckout(orderId: string, dto: CreateCheckoutDto) {
    return {
      orderId,
      checkoutUrl: `${dto.successUrl}?session=mock_checkout_session`
    };
  }

  getRecipe(orderId: string) {
    return {
      orderId,
      status: 'paid',
      recipe: {
        id: `recipe_${orderId}`,
        name: 'Deterministic Sunset',
        method: 'Shake all ingredients with ice and strain into a chilled coupe.',
        glassware: 'Coupe',
        garnish: 'Dehydrated orange wheel',
        ingredients: [
          { name: 'Gin', amount: '45ml' },
          { name: 'Aperol', amount: '20ml' },
          { name: 'Fresh lemon juice', amount: '15ml' }
        ]
      }
    };
  }

  listOrders(barId: string, status?: string) {
    return {
      items: [
        {
          id: 'order_1',
          barId,
          customerName: 'Alex',
          status: status ?? 'pending',
          createdAt: new Date().toISOString()
        }
      ]
    };
  }
}
