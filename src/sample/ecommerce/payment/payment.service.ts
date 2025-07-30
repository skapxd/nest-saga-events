import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventMetadataHelper } from '#/saga-event-module/services/event-metadata.helper';
import { EmitsEvent } from '#/saga-event-module/decorators/emits-event.decorator';
import { OnEventDoc } from '#/saga-event-module/decorators/on-event-doc.decorator';
import { CausationEvent } from '#/saga-event-module/decorators/causation-event.decorator';
import { EventPayload } from '#/saga-event-module/interfaces/event.interfaces';
import { PlaceOrderDto } from '../order/dto/place-order.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    public readonly eventEmitter: EventEmitter2,
    public readonly eventMetadataHelper: EventMetadataHelper,
  ) {}

  @OnEventDoc('inventory.reserved.success')
  @EmitsEvent({
    onSuccess: {
      name: 'payment.processed.success',
      description: 'Fired when the payment is successfully processed.',
    },
    onFailure: {
      name: 'payment.processed.failure',
      description: 'Fired when the payment is rejected.',
    },
  })
  handleInventoryReserved(
    @CausationEvent() payload: EventPayload<PlaceOrderDto>,
  ) {
    this.logger.log('--- Payment Service: Processing Payment ---');
    this.logger.log('Received inventory reservation:', payload.data);
    this.logger.log('Correlation ID:', payload.metadata.correlationId);

    // Simulate payment processing
    if (payload.data.total > 1000) {
      this.logger.error('Payment failed: Amount exceeds limit.');
      throw new Error('Payment rejected by the gateway.');
    }

    this.logger.log('Payment processed successfully.');
    // Pass the original payload through
    return payload.data;
  }
}
