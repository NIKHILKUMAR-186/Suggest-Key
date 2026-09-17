export class AsyncLocalStorage<T> {
  private store: T | undefined;

  getStore(): T | undefined {
    return this.store;
  }

  enterWith(store: T): void {
    this.store = store;
  }

  run<R>(store: T, callback: () => R): R {
    const prevStore = this.store;
    this.store = store;
    try {
      return callback();
    } finally {
      this.store = prevStore;
    }
  }
}

export function createAsyncLocalStorage<T>(): AsyncLocalStorage<T> {
  return new AsyncLocalStorage<T>();
}