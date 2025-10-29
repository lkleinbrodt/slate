const store = new Map<string, string>();

export default {
  async getItem(key: string): Promise<string | null> {
    return store.has(key) ? store.get(key)! : null;
  },
  async setItem(key: string, value: string): Promise<void> {
    store.set(key, value);
  },
  async removeItem(key: string): Promise<void> {
    store.delete(key);
  },
};

export const resetStorage = () => {
  store.clear();
};

export const dumpStorage = () => new Map(store);
