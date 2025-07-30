import { Injectable } from '@nestjs/common';

// Interfaces para los datos que vamos a registrar
export interface EmitterInfo {
  name: string;
  className: string;
  methodName: string;
}
export interface ListenerInfo {
  eventName: string;
  className: string;
  methodName: string;
}

@Injectable()
export class SagaRegistryService {
  public readonly emitters = new Map<string, EmitterInfo>();
  public readonly listeners = new Map<string, ListenerInfo[]>();

  registerEmitter(info: EmitterInfo) {
    this.emitters.set(info.name, info);
  }

  registerListener(info: ListenerInfo) {
    const existing = this.listeners.get(info.eventName) || [];
    this.listeners.set(info.eventName, [...existing, info]);
  }
}
