import { Module } from '@nestjs/common';
import { OrderModule } from './order/order.module';
import { InventoryModule } from './inventory/inventory.module';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    // Ecommerce Example
    OrderModule,
    InventoryModule,
    PaymentModule,
  ],
})
export class ECommerceModule {}
