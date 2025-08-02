import { Injectable, Logger } from '@nestjs/common';
import { OnEventDoc } from '#/src/saga-event-module/decorators/on-event-doc.decorator';
import { EmitsEvent } from '#/src/saga-event-module/decorators/emits-event.decorator';
import { CausationEvent } from '#/src/saga-event-module/decorators/causation-event.decorator';
import { EventPayload } from '#/src/saga-event-module/interfaces/event.interfaces';
import { JsonDatabaseService } from '#/src/database/json/json-database.service';

interface VideoProcessingState {
  correlationId: string;
  hasTranscodingFinished: boolean;
  hasThumbnailFinished: boolean;
  payloads: any[];
}

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly collectionName = 'video_processing_state';

  constructor(private readonly dbService: JsonDatabaseService) {}

  @OnEventDoc(['video.transcoded.success', 'thumbnail.generated.success'])
  @EmitsEvent({
    onSuccess: {
      name: 'video.ready.to.publish',
      description:
        'Fired when all video processing steps are confirmed to be complete.',
    },
    onFailure: {
      name: 'video.verification.failed',
      description: 'Fired if the verification process fails.',
    },
  })
  async verifyVideoProcessing(
    @CausationEvent() payload: EventPayload<any>,
  ): Promise<VideoProcessingState | null> {
    const updatedState = await this.findAndUpdateState(payload);
    this.logger.log('Current processing state:', updatedState);

    if (!this.isVerificationComplete(updatedState)) {
      this.logger.log('Verification incomplete. Suppressing event emission.');
      return null;
    }

    this.logger.log('All tasks complete. Emitting video.ready.to.publish...');
    await this.cleanupState(updatedState.correlationId);
    return updatedState;
  }

  /**
   * Finds the current state for the saga, updates it with the new event data,
   * and persists it back to the database. If no state exists, it creates a new one.
   */
  private async findAndUpdateState(
    payload: EventPayload<any>,
  ): Promise<VideoProcessingState> {
    const { correlationId } = payload.metadata;
    const eventName = payload.metadata.causationId?.split(':')[0];
    this.logger.log(`--- Verification Service: Received ${eventName} ---`);

    const results = await this.dbService.findInCollection<VideoProcessingState>(
      this.collectionName,
      (item) => item.correlationId === correlationId,
    );
    const currentState = results[0];

    const update: Partial<VideoProcessingState> =
      eventName === 'video.transcoded.success'
        ? { hasTranscodingFinished: true }
        : { hasThumbnailFinished: true };

    if (!currentState) {
      const newState: VideoProcessingState = {
        correlationId,
        hasTranscodingFinished: false,
        hasThumbnailFinished: false,
        payloads: [payload.data],
        ...update,
      };
      await this.dbService.addToCollection(this.collectionName, newState);
      return newState;
    } else {
      const updatedPayloads = [...currentState.payloads, payload.data];
      const updatedState = { ...update, payloads: updatedPayloads };
      await this.dbService.updateCollection<VideoProcessingState>(
        this.collectionName,
        (item) => item.correlationId === correlationId,
        updatedState,
      );
      return { ...currentState, ...updatedState };
    }
  }

  /**
   * Checks if all conditions for completing the verification are met.
   */
  private isVerificationComplete(state: VideoProcessingState): boolean {
    return state?.hasTranscodingFinished && state?.hasThumbnailFinished;
  }

  /**
   * Removes the saga's verification state from the database.
   */
  private async cleanupState(correlationId: string): Promise<void> {
    await this.dbService.deleteFromCollection<VideoProcessingState>(
      this.collectionName,
      (item) => item.correlationId === correlationId,
    );
  }
}
