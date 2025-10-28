import { jwtDecode } from 'jwt-decode';

export class TokenStorageService {
  private readonly tokenKey: string;
  private readonly storage: Storage;

  private static createMemoryStorage(): Storage {
    const store = new Map<string, string>();
    return {
      get length() {
        return store.size;
      },
      clear: () => store.clear(),
      getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      removeItem: (key: string) => void store.delete(key),
      setItem: (key: string, value: string) => void store.set(key, value),
    } as Storage;
  }

  constructor(tokenKey: string = 'telas_token', storage?: Storage) {
    this.tokenKey = tokenKey;
    const globalStorage: any = (typeof window !== 'undefined' && (window as any).localStorage) || (globalThis as any).localStorage;
    this.storage = storage ?? globalStorage ?? TokenStorageService.createMemoryStorage();
  }

  setToken(token: string): void {
    this.storage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return this.storage.getItem(this.tokenKey);
  }

  removeToken(): void {
    this.storage.removeItem(this.tokenKey);
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    try {
      const decoded: any = jwtDecode(token);
      const exp = typeof decoded?.exp === 'number' ? decoded.exp : 0;
      if (!exp) return false;
      const nowSeconds = Math.floor(Date.now() / 1000);
      return exp > nowSeconds;
    } catch {
      return false;
    }
  }
}


