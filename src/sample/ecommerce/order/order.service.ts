import { Injectable, Logger } from '@nestjs/common';
import { EmitsEvent } from '#/saga-event-module/decorators/emits-event.decorator';
import { PlaceOrderDto } from './dto/place-order.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  @EmitsEvent({
    onInit: {
      name: 'order.placement.init',
      description: 'Starts the order placement process.',
    },
    onSuccess: {
      name: 'order.confirmed.success',
      description: 'Fired when the order is fully confirmed and paid.',
    },
    onFailure: {
      name: 'order.placement.failed',
      description: 'Fired when any step in the order placement saga fails.',
    },
  })
  placeOrder(orderDto: PlaceOrderDto) {
    this.logger.log(`--- Order Service: Initiating ---`);
    this.logger.log('Attempting to place order:', orderDto);
    // In a real app, this would create an order in 'PENDING' state.
    // The decorator will handle emitting 'order.placement.init'.
    // The saga continues from there. We return the DTO as the initial payload.
    return orderDto;
  }
}
