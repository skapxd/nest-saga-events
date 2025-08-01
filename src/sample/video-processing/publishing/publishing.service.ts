import { Injectable, Logger } from '@nestjs/common';
import { OnEventDoc } from '#/src/saga-event-module/decorators/on-event-doc.decorator';
import { EmitsEvent } from '#/src/saga-event-module/decorators/emits-event.decorator';
import { CausationEvent } from '#/src/saga-event-module/decorators/causation-event.decorator';
import { EventPayload } from '#/src/saga-event-module/interfaces/event.interfaces';
import { JsonDatabaseService } from '#/src/database/json/json-database.service';

import { DependsOnEvent } from '#/src/saga-event-module/decorators/depends-on-event.decorator';

interface VideoProcessingState {
  correlationId: string;
  hasTranscodingFinished: boolean;
  hasThumbnailFinished: boolean;
  payloads: any[];
}

@Injectable()
export class PublishingService {
  private readonly logger = new Logger(PublishingService.name);
  private readonly collectionName = 'video_processing_state';

  constructor(private readonly dbService: JsonDatabaseService) {}

  @OnEventDoc('video.transcoded.success')
  async handleTranscodingSuccess(@CausationEvent() payload: EventPayload<any>) {
    this.logger.log('--- Publishing Service: Received Transcoding Success ---');
    await this.updateState(payload, { hasTranscodingFinished: true });
  }

  @OnEventDoc('thumbnail.generated.success')
  async handleThumbnailSuccess(@CausationEvent() payload: EventPayload<any>) {
    this.logger.log('--- Publishing Service: Received Thumbnail Success ---');
    await this.updateState(payload, { hasThumbnailFinished: true });
  }

  private async updateState(
    payload: EventPayload<any>,
    update: Partial<VideoProcessingState>,
  ) {
    const { correlationId } = payload.metadata;
    const results = await this.dbService.findInCollection<VideoProcessingState>(
      this.collectionName,
      (item: VideoProcessingState) => item.correlationId === correlationId,
    );
    let state = results[0];

    if (!state) {
      state = {
        correlationId,
        hasTranscodingFinished: false,
        hasThumbnailFinished: false,
        payloads: [payload.data],
        ...update,
      };
      await this.dbService.addToCollection(this.collectionName, state);
    } else {
      const updatedPayloads = [...state.payloads, payload.data];
      const updatedState = { ...update, payloads: updatedPayloads };
      await this.dbService.updateCollection<VideoProcessingState>(
        this.collectionName,
        (item: VideoProcessingState) => item.correlationId === correlationId,
        updatedState,
      );
      state = { ...state, ...updatedState };
    }

    this.logger.log('Current processing state:', state);
    if (state && state.hasTranscodingFinished && state.hasThumbnailFinished) {
      this.logger.log('All tasks complete. Publishing video...');
      this.publishVideo(state);
    }
  }

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
  @DependsOnEvent('video.transcoded.success')
  @DependsOnEvent('thumbnail.generated.success')
  private publishVideo(state: VideoProcessingState) {
    // In a real app, this would combine the data from all payloads
    // and move the video to its final destination.
    const finalPayload = state.payloads.reduce(
      (acc, p) => ({ ...acc, ...p }),
      {},
    );
    this.logger.log('--- Publishing Service: Publishing Video ---');
    this.logger.log('Final combined payload:', finalPayload);
    this.logger.log('Video published successfully!');
    return { ...finalPayload, publishedAt: new Date().toISOString() };
  }
}
