import { AppEvents } from './generated-events';

// 1. Extrae las llaves del objeto AppEvents (ej. 'PROJECT_CREATION_SUCCESS')
type AppEventKey = keyof typeof AppEvents;

// 2. Crea un tipo de mapa que relaciona el nombre del evento (string) con su clase de payload
// Ejemplo: { 'project.creation.success': ProjectCreationSuccessPayload, ... }
export type EventPayloadMap = {
  [K in AppEventKey as (typeof AppEvents)[K]['name']]: (typeof AppEvents)[K]['payloadClass'] extends abstract new (
    ...args: any
  ) => any
    ? InstanceType<(typeof AppEvents)[K]['payloadClass']>
    : void;
};

// 3. Crea un tipo que representa todos los nombres de eventos válidos (string)
// Ejemplo: 'project.creation.success' | 'project.creation.failed' | ...
export type AppEventName =
  | keyof EventPayloadMap
  | (string & NonNullable<unknown>);
