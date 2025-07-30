import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventMetadataHelper } from '#/saga-event-module/services/event-metadata.helper';
import { EmitsEvent } from '#/saga-event-module/decorators/emits-event.decorator';
import { OnEventDoc } from '#/saga-event-module/decorators/on-event-doc.decorator';
import { CausationEvent } from '#/saga-event-module/decorators/causation-event.decorator';
import { EventPayload } from '#/saga-event-module/interfaces/event.interfaces';
import { PlaceOrderDto } from '../order/dto/place-order.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    public readonly eventEmitter: EventEmitter2,
    public readonly eventMetadataHelper: EventMetadataHelper,
  ) {}

  @OnEventDoc('order.placement.init')
  @EmitsEvent({
    onSuccess: {
      name: 'inventory.reserved.success',
      description: 'Fired when stock has been successfully reserved.',
    },
    onFailure: {
      name: 'inventory.reserved.failure',
      description: 'Fired when there is not enough stock.',
    },
  })
  handleOrderPlacement(@CausationEvent() payload: EventPayload<PlaceOrderDto>) {
    this.logger.log('--- Inventory Service: Reserving Stock ---');
    this.logger.log('Received order details:', payload.data);
    this.logger.log('Correlation ID:', payload.metadata.correlationId);

    // Simulate stock check
    if (
      payload.data.products.some(
        (p: { productId: string; quantity: number }) =>
          p.productId === 'PRODUCT_OUT_OF_STOCK',
      )
    ) {
      this.logger.error('Inventory check failed: Product out of stock.');
      throw new Error('Not enough stock for the requested products.');
    }

    this.logger.log('Stock successfully reserved.');
    // The original payload is passed through to the next step
    return payload.data;
  }

  @OnEventDoc('payment.processed.failure')
  handlePaymentFailure(@CausationEvent() payload: EventPayload<any>) {
    this.logger.log('--- Inventory Service: Compensating Transaction ---');
    this.logger.log('Received payment failure event. Releasing stock.');
    this.logger.log('Correlation ID:', payload.metadata.correlationId);
    // In a real app, you would use the payload data to find the specific
    // reservation and release the items back into the inventory.
    this.logger.log('Stock released successfully.');
  }
}
