export class PlaceOrderDto {
  customerId: string;
  products: { productId: string; quantity: number }[];
  total: number;
}
