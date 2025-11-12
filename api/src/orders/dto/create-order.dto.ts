// api/src/orders/dto/create-order.dto.ts
export class CreateOrderDto {
  items: { sku: string; qty: number }[] = [];  // <-- initialized
  total?: number;
}
