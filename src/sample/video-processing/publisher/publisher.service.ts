import { Injectable, Logger } from '@nestjs/common';
import { OnEventDoc } from '#/src/saga-event-module/decorators/on-event-doc.decorator';
import { EmitsEvent } from '#/src/saga-event-module/decorators/emits-event.decorator';
import { CausationEvent } from '#/src/saga-event-module/decorators/causation-event.decorator';
import { EventPayload } from '#/src/saga-event-module/interfaces/event.interfaces';

@Injectable()
export class PublisherService {
  private readonly logger = new Logger(PublisherService.name);

  @OnEventDoc('video.ready.to.publish')
  @EmitsEvent({
    onSuccess: {
      name: 'video.published.success',
      description: 'Fired when the video is fully processed and published.',
    },
    onFailure: {
      name: 'video.published.failure',
      description: 'Fired if the final publishing step fails.',
    },
  })
  publishVideo(@CausationEvent() event: EventPayload<any>) {
    const finalPayload = event.data.payloads.reduce(
      (acc: any, p: any) => ({ ...acc, ...p }),
      {},
    );

    this.logger.log(
      '--- Publisher Service: Received video.ready.to.publish ---',
    );
    this.logger.log('--- Publisher Service: Publishing Video ---');
    this.logger.log('Final combined payload:', finalPayload);
    this.logger.log('Video published successfully!');

    return { ...finalPayload, publishedAt: new Date().toISOString() };
  }
}
