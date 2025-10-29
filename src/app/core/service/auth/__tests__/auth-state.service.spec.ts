import { AuthStateService } from '../auth-state.service';

describe('AuthStateService', () => {
  let service: AuthStateService;

  beforeEach(() => {
    service = new AuthStateService();
  });

  it('default states', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.isLoading()).toBe(false);
    expect(service.user()).toBeNull();
  });

  it('set user and loading', () => {
    service.setLoading(true);
    expect(service.isLoading()).toBe(true);
    service.setUser({ id: '1' } as any);
    expect(service.isAuthenticated()).toBe(true);
    service.clear();
    expect(service.isAuthenticated()).toBe(false);
  });
});


