import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  EventPayload,
  EventMetadata,
  Actor,
} from '#/src/saga-event-module/interfaces/event.interfaces';
import { Type } from 'class-transformer';

// DTOs for business logic
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;
}

export class User {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;
}

// DTO for Event Metadata Validation
class ActorDto implements Actor {
  @IsString()
  type: 'user' | 'system';

  @IsString()
  id: string;

  @IsObject()
  details?: Record<string, any>;
}

class EventMetadataDto implements EventMetadata {
  @IsString()
  readonly eventId: string;

  @IsString()
  readonly correlationId: string;

  @IsString()
  readonly causationId: string | null;

  @Type(() => Date)
  readonly timestamp: Date;

  @ValidateNested()
  @Type(() => ActorDto)
  readonly actor: Actor;
}

// DTO for the full event payload
export class UserCreatedSuccessPayload implements EventPayload<User> {
  @ValidateNested()
  @Type(() => EventMetadataDto)
  @IsObject()
  metadata: EventMetadataDto;

  @ValidateNested()
  @Type(() => User)
  @IsObject()
  data: User;
}
