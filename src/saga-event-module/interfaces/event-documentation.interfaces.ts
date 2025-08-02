import { AppEventName } from '../types';

export interface EmitterInfo {
  eventName: AppEventName;
  className: string;
  methodName: string;
  description: string;
  triggeredBy?: string[];
}

export interface ListenerInfo {
  eventName: AppEventName;
  className: string;
  methodName: string;
}
