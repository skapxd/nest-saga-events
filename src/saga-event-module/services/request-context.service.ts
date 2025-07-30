import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class RequestContextService {
  private readonly als = new AsyncLocalStorage<Map<string, any>>();

  run(callback: () => void) {
    this.als.run(new Map(), callback);
  }

  set<T>(key: string, value: T) {
    const store = this.als.getStore();
    if (store) {
      store.set(key, value);
    }
  }

  get<T>(key: string): T | undefined {
    const store = this.als.getStore();
    return store?.get(key) as T | undefined;
  }
}
