import { BehaviorSubject, Observable } from 'rxjs';
import { Client } from '@app/model/client';
import { MapPoint } from '@app/core/service/state/map-point.interface';

/**
 * Interface para gerenciamento de estado de cliente
 * Define contrato para serviços que gerenciam estado do cliente
 */
export interface IClientStateService {
  /**
   * Cliente atual
   */
  currentClient$: Observable<Client | null>;

  /**
   * Indica se está carregando dados do cliente
   */
  isLoading$: Observable<boolean>;

  /**
   * Indica se há erro
   */
  hasError$: Observable<boolean>;

  /**
   * Mensagem de erro
   */
  errorMessage$: Observable<string | null>;

  /**
   * Atualiza o cliente atual
   * @param client - Cliente para definir como atual
   */
  setCurrentClient(client: Client | null): void;

  /**
   * Define estado de carregamento
   * @param loading - Estado de carregamento
   */
  setLoading(loading: boolean): void;

  /**
   * Define erro
   * @param error - Mensagem de erro
   */
  setError(error: string | null): void;

  /**
   * Limpa o estado
   */
  clearState(): void;
}

/**
 * Interface para gerenciamento de estado de mapa
 */
export interface IMapStateService {
  /**
   * Pontos do mapa
   */
  mapPoints$: Observable<MapPoint[]>;

  /**
   * Centro do mapa
   */
  mapCenter$: Observable<{ lat: number; lng: number } | null>;

  /**
   * Zoom do mapa
   */
  mapZoom$: Observable<number>;

  /**
   * Indica se o mapa está carregando
   */
  isLoading$: Observable<boolean>;

  /**
   * Adiciona pontos ao mapa
   * @param points - Pontos para adicionar
   */
  addMapPoints(points: MapPoint[]): void;

  /**
   * Remove pontos do mapa
   * @param pointIds - IDs dos pontos para remover
   */
  removeMapPoints(pointIds: string[]): void;

  /**
   * Atualiza centro do mapa
   * @param center - Novo centro
   */
  updateMapCenter(center: { lat: number; lng: number }): void;

  /**
   * Atualiza zoom do mapa
   * @param zoom - Novo zoom
   */
  updateMapZoom(zoom: number): void;

  /**
   * Limpa todos os pontos
   */
  clearMapPoints(): void;
}

/**
 * Interface para gerenciamento de estado de autenticação
 */
export interface IAuthStateService {
  /**
   * Usuário autenticado
   */
  authenticatedUser$: Observable<Client | null>;

  /**
   * Indica se está autenticado
   */
  isAuthenticated$: Observable<boolean>;

  /**
   * Token atual
   */
  currentToken$: Observable<string | null>;

  /**
   * Indica se está fazendo login
   */
  isLoggingIn$: Observable<boolean>;

  /**
   * Define usuário autenticado
   * @param user - Usuário autenticado
   */
  setAuthenticatedUser(user: Client | null): void;

  /**
   * Define token atual
   * @param token - Token de autenticação
   */
  setCurrentToken(token: string | null): void;

  /**
   * Define estado de login
   * @param loggingIn - Estado de login
   */
  setLoggingIn(loggingIn: boolean): void;

  /**
   * Limpa estado de autenticação
   */
  clearAuthState(): void;
}

/**
 * Interface para gerenciamento de estado de loading
 */
export interface ILoadingStateService {
  /**
   * Indica se está carregando
   */
  isLoading$: Observable<boolean>;

  /**
   * Mensagem de loading
   */
  loadingMessage$: Observable<string | null>;

  /**
   * Define estado de loading
   * @param loading - Estado de loading
   * @param message - Mensagem opcional
   */
  setLoading(loading: boolean, message?: string): void;

  /**
   * Mostra loading com mensagem
   * @param message - Mensagem de loading
   */
  showLoading(message?: string): void;

  /**
   * Esconde loading
   */
  hideLoading(): void;
}

/**
 * Interface para gerenciamento de estado de sidebar
 */
export interface ISidebarStateService {
  /**
   * Indica se sidebar está aberta
   */
  isOpen$: Observable<boolean>;

  /**
   * Largura atual da sidebar
   */
  currentWidth$: Observable<number>;

  /**
   * Indica se é mobile
   */
  isMobile$: Observable<boolean>;

  /**
   * Abre/fecha sidebar
   * @param open - Estado da sidebar
   */
  toggleSidebar(open?: boolean): void;

  /**
   * Define largura da sidebar
   * @param width - Nova largura
   */
  setSidebarWidth(width: number): void;

  /**
   * Define se é mobile
   * @param mobile - Estado mobile
   */
  setMobile(mobile: boolean): void;
}

/**
 * Interface para gerenciamento de estado de tema
 */
export interface IThemeStateService {
  /**
   * Tema atual
   */
  currentTheme$: Observable<'light' | 'dark'>;

  /**
   * Indica se é tema escuro
   */
  isDarkMode$: Observable<boolean>;

  /**
   * Muda tema
   * @param theme - Novo tema
   */
  switchTheme(theme: 'light' | 'dark'): void;

  /**
   * Alterna entre temas
   */
  toggleTheme(): void;

  /**
   * Aplica tema ao DOM
   * @param theme - Tema para aplicar
   */
  applyTheme(theme: 'light' | 'dark'): void;
}

/**
 * Interface base para serviços de estado
 */
export interface IBaseStateService<T> {
  /**
   * Estado atual
   */
  state$: Observable<T>;

  /**
   * Atualiza estado
   * @param newState - Novo estado
   */
  updateState(newState: T): void;

  /**
   * Obtém estado atual
   * @returns Estado atual
   */
  getCurrentState(): T;

  /**
   * Limpa estado
   */
  clearState(): void;
}
