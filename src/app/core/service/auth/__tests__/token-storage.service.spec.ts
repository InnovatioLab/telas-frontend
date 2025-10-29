import { TokenStorageService } from '../token-storage.service';

function createJwt(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const b64 = (obj: any) =>
    btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  return `${b64(header)}.${b64(payload)}.signature`;
}

describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    const memory: any = (() => {
      const store = new Map<string, string>();
      return {
        clear: () => store.clear(),
        getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
        key: (i: number) => Array.from(store.keys())[i] ?? null,
        removeItem: (k: string) => void store.delete(k),
        setItem: (k: string, v: string) => void store.set(k, v),
        get length() {
          return store.size;
        },
      } as Storage;
    })();
    service = new TokenStorageService('test_token', memory);
  });

  it('set/get/remove token', () => {
    service.setToken('abc');
    expect(service.getToken()).toBe('abc');
    service.removeToken();
    expect(service.getToken()).toBeNull();
  });

  it('isTokenValid false when missing or invalid', () => {
    expect(service.isTokenValid()).toBe(false);
    service.setToken('invalid');
    expect(service.isTokenValid()).toBe(false);
  });

  it('isTokenValid true when exp in the future', () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const token = createJwt({ exp: future });
    service.setToken(token);
    expect(service.isTokenValid()).toBe(true);
  });

  it('isTokenValid false when exp in the past', () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    const token = createJwt({ exp: past });
    service.setToken(token);
    expect(service.isTokenValid()).toBe(false);
  });
});


