export class BaseStore<T> {
  constructor(
    protected db: IDBDatabase,
    protected storeName: string
  ) {}

  async get(key: IDBValidKey): Promise<T | undefined> {
    return this.tx('readonly', store => store.get(key));
  }

  async put(value: T): Promise<void> {
    await this.tx('readwrite', store => store.put(value));
  }

  async getAll(): Promise<T[]> {
    return this.tx('readonly', store => store.getAll());
  }

  async delete(key: IDBValidKey): Promise<void> {
    return this.tx('readwrite', store => store.delete(key));
  }

  async clear(): Promise<void> {
    return this.tx('readwrite', store => store.clear());
  }

  protected tx<R>(
    mode: IDBTransactionMode,
    fn: (store: IDBObjectStore) => IDBRequest<R>
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      try {
        const tx = this.db.transaction(this.storeName, mode);
        const store = tx.objectStore(this.storeName);
        const req = fn(store);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }
}
