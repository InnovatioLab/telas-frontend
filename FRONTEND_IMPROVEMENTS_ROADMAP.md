# 🚀 Frontend Improvement Roadmap - Telas Project

## 📋 Overview
Este documento mapeia todas as melhorias necessárias no frontend Angular, organizadas por módulos e prioridades. O objetivo é melhorar a arquitetura, desacoplar serviços externos, aumentar a legibilidade e separar melhor os componentes.

---

## 🏗️ **ARQUITETURA GERAL**

### **Problemas Identificados:**
- ❌ Mistura de responsabilidades nos componentes
- ❌ Acoplamento forte com serviços externos
- ❌ Falta de separação clara entre lógica de negócio e apresentação
- ❌ Componentes muito grandes com múltiplas responsabilidades
- ❌ Falta de interfaces bem definidas
- ❌ Inconsistência na estrutura de pastas

### **Soluções Propostas:**
- ✅ Implementar arquitetura em camadas (Presentation, Business, Data)
- ✅ Criar interfaces bem definidas
- ✅ Implementar padrão Repository para serviços
- ✅ Separar lógica de negócio em services dedicados
- ✅ Criar componentes menores e mais focados

---

## 📁 **MÓDULO: CORE**

### **Task 1: Refatorar Services de API**
**Prioridade:** 🔴 Alta
**Tempo estimado:** 3-4 dias

#### **Problemas:**
- `BaseHttpService` muito genérico e acoplado
- Services fazem múltiplas responsabilidades
- Falta de tratamento de erro consistente
- Acoplamento direto com HttpClient

#### **Soluções:**
```typescript
// 1. Criar interfaces para repositories
interface ClientRepository {
  findById(id: string): Observable<Client>;
  save(client: Client): Observable<Client>;
  update(id: string, client: Partial<Client>): Observable<Client>;
  delete(id: string): Observable<void>;
}

// 2. Implementar Repository Pattern
@Injectable()
export class ClientRepositoryImpl implements ClientRepository {
  constructor(private httpClient: HttpClient) {}
  
  findById(id: string): Observable<Client> {
    return this.httpClient.get<Client>(`${API_ENDPOINTS.CLIENTS}/${id}`)
      .pipe(
        catchError(this.handleError),
        map(response => this.mapToDomain(response))
      );
  }
}

// 3. Criar Service de domínio
@Injectable()
export class ClientDomainService {
  constructor(private clientRepository: ClientRepository) {}
  
  async createClient(clientData: CreateClientRequest): Promise<Client> {
    // Lógica de negócio aqui
    const client = this.validateAndMapClient(clientData);
    return this.clientRepository.save(client);
  }
}
```

#### **Arquivos a modificar:**
- `core/service/api/client.service.ts`
- `core/service/api/base-htttp.service.ts`
- `core/service/api/cart.service.ts`
- `core/service/api/subscription.service.ts`
- `core/service/api/box.service.ts`

---

### **Task 2: Implementar Error Handling Centralizado**
**Prioridade:** 🔴 Alta
**Tempo estimado:** 2 dias

#### **Problemas:**
- Tratamento de erro inconsistente
- Console.log espalhados pelo código
- Falta de logging estruturado
- Usuário não recebe feedback adequado

#### **Soluções:**
```typescript
// 1. Criar Error Handler centralizado
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private toastService: ToastService) {}
  
  handleError(error: any): void {
    const errorMessage = this.extractErrorMessage(error);
    this.toastService.showError(errorMessage);
    this.logError(error);
  }
  
  private extractErrorMessage(error: any): string {
    if (error.error?.message) return error.error.message;
    if (error.message) return error.message;
    return 'An unexpected error occurred';
  }
}

// 2. Criar Error Interceptor
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const errorMessage = this.getErrorMessage(error);
        this.toastService.showError(errorMessage);
        return throwError(() => error);
      })
    );
  }
}
```

---

### **Task 3: Refatorar Authentication Service**
**Prioridade:** 🔴 Alta
**Tempo estimado:** 2-3 dias

#### **Problemas:**
- `Authentication` e `AutenticacaoService` duplicados
- Lógica de JWT espalhada
- Falta de separação entre storage e lógica de negócio
- Signals mal utilizados

#### **Soluções:**
```typescript
// 1. Unificar em um único service
@Injectable()
export class AuthService {
  private readonly _user = signal<User | null>(null);
  private readonly _isAuthenticated = computed(() => !!this._user());
  
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = this._isAuthenticated;
  
  constructor(
    private authRepository: AuthRepository,
    private tokenStorage: TokenStorageService
  ) {}
  
  async login(credentials: LoginRequest): Promise<void> {
    const authResponse = await this.authRepository.login(credentials);
    this.tokenStorage.setToken(authResponse.token);
    this._user.set(authResponse.user);
  }
}

// 2. Separar Token Storage
@Injectable()
export class TokenStorageService {
  private readonly TOKEN_KEY = 'telas_token';
  
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
  
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
  
  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}
```

---

## 📁 **MÓDULO: SHARED COMPONENTS**

### **Task 4: Refatorar MapsComponent**
**Prioridade:** 🟡 Média
**Tempo estimado:** 3-4 dias

#### **Problemas:**
- Componente muito grande (851 linhas)
- Múltiplas responsabilidades
- Acoplamento forte com Google Maps API
- Lógica de clustering complexa

#### **Soluções:**
```typescript
// 1. Separar em múltiplos componentes
@Component({
  selector: 'app-map-container',
  template: `
    <div #mapContainer [style.width]="width" [style.height]="height"></div>
    <app-map-markers [points]="points" [map]="map"></app-map-markers>
    <app-map-clusters [points]="points" [map]="map"></app-map-clusters>
  `
})
export class MapContainerComponent {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @Input() points: MapPoint[] = [];
  @Input() center: { lat: number; lng: number } | null = null;
  
  map: google.maps.Map | null = null;
}

// 2. Criar service para Google Maps
@Injectable()
export class GoogleMapsService {
  private mapInstance: google.maps.Map | null = null;
  
  initializeMap(container: ElementRef, options: MapOptions): google.maps.Map {
    this.mapInstance = new google.maps.Map(container.nativeElement, options);
    return this.mapInstance;
  }
  
  addMarkers(points: MapPoint[]): google.maps.Marker[] {
    return points.map(point => this.createMarker(point));
  }
}

// 3. Criar componente para markers
@Component({
  selector: 'app-map-markers',
  template: `
    <ng-container *ngFor="let marker of markers">
      <!-- Marker template -->
    </ng-container>
  `
})
export class MapMarkersComponent {
  @Input() points: MapPoint[] = [];
  @Input() map: google.maps.Map | null = null;
  
  markers: google.maps.Marker[] = [];
}
```

---

### **Task 5: Refatorar HeaderComponent**
**Prioridade:** 🟡 Média
**Tempo estimado:** 2-3 dias

#### **Problemas:**
- Componente muito grande (400 linhas)
- Múltiplas responsabilidades (menu, carrinho, notificações)
- Lógica de estado complexa
- Acoplamento com múltiplos serviços

#### **Soluções:**
```typescript
// 1. Separar em componentes menores
@Component({
  selector: 'app-header',
  template: `
    <app-header-brand></app-header-brand>
    <app-header-navigation></app-header-navigation>
    <app-header-actions></app-header-actions>
  `
})
export class HeaderComponent {}

// 2. Criar componente para ações do header
@Component({
  selector: 'app-header-actions',
  template: `
    <app-cart-button [itemCount]="cartItemCount"></app-cart-button>
    <app-notifications-button [count]="notificationCount"></app-notifications-button>
    <app-user-menu [user]="currentUser"></app-user-menu>
  `
})
export class HeaderActionsComponent {
  cartItemCount = signal(0);
  notificationCount = signal(0);
  currentUser = signal<User | null>(null);
}

// 3. Criar service para estado do header
@Injectable()
export class HeaderStateService {
  private readonly _cartItemCount = signal(0);
  private readonly _notificationCount = signal(0);
  
  readonly cartItemCount = this._cartItemCount.asReadonly();
  readonly notificationCount = this._notificationCount.asReadonly();
  
  updateCartCount(count: number): void {
    this._cartItemCount.set(count);
  }
}
```

---

### **Task 6: Refatorar Sidebar Components**
**Prioridade:** 🟡 Média
**Tempo estimado:** 2 dias

#### **Problemas:**
- `ClientMenuSideComponent` e `AdminMenuSideComponent` muito similares
- Lógica duplicada
- Acoplamento com serviços de autenticação

#### **Soluções:**
```typescript
// 1. Criar componente base
@Component({
  selector: 'app-base-sidebar',
  template: `
    <div class="sidebar" [class.open]="isOpen">
      <app-sidebar-header [user]="currentUser"></app-sidebar-header>
      <app-sidebar-menu [items]="menuItems"></app-sidebar-menu>
      <app-sidebar-footer></app-sidebar-footer>
    </div>
  `
})
export class BaseSidebarComponent {
  @Input() isOpen = false;
  @Input() menuItems: MenuItem[] = [];
  @Input() currentUser: User | null = null;
}

// 2. Criar componentes específicos
@Component({
  selector: 'app-client-sidebar',
  template: `
    <app-base-sidebar 
      [isOpen]="isOpen"
      [menuItems]="clientMenuItems"
      [currentUser]="currentUser">
    </app-base-sidebar>
  `
})
export class ClientSidebarComponent {
  clientMenuItems: MenuItem[] = [
    { label: 'Home', icon: 'pi-home', route: '/client' },
    { label: 'Wishlist', icon: 'pi-heart', route: '/client/wishlist' },
    // ...
  ];
}
```

---

## 📁 **MÓDULO: CLIENT**

### **Task 7: Refatorar ClientViewComponent**
**Prioridade:** 🔴 Alta
**Tempo estimado:** 3-4 dias

#### **Problemas:**
- Múltiplas responsabilidades (mapa, busca, geolocalização)
- Acoplamento com muitos serviços
- Lógica de estado complexa
- Falta de separação de concerns

#### **Soluções:**
```typescript
// 1. Separar em componentes menores
@Component({
  selector: 'app-client-view',
  template: `
    <app-search-section (search)="onSearch($event)"></app-search-section>
    <app-map-container 
      [center]="mapCenter"
      [points]="monitors"
      (pointClick)="onPointClick($event)">
    </app-map-container>
    <app-sidebar-mapa></app-sidebar-mapa>
  `
})
export class ClientViewComponent {
  mapCenter: { lat: number; lng: number } | null = null;
  monitors: MapPoint[] = [];
  
  constructor(private clientViewService: ClientViewService) {}
  
  async ngOnInit(): Promise<void> {
    await this.clientViewService.initializeMap();
    this.mapCenter = this.clientViewService.getMapCenter();
  }
}

// 2. Criar service para lógica de negócio
@Injectable()
export class ClientViewService {
  private readonly _mapCenter = signal<{ lat: number; lng: number } | null>(null);
  private readonly _monitors = signal<MapPoint[]>([]);
  
  readonly mapCenter = this._mapCenter.asReadonly();
  readonly monitors = this._monitors.asReadonly();
  
  constructor(
    private geolocationService: GeolocationService,
    private mapsService: GoogleMapsService
  ) {}
  
  async initializeMap(): Promise<void> {
    const position = await this.geolocationService.getCurrentPosition();
    this._mapCenter.set({ lat: position.latitude, lng: position.longitude });
  }
  
  searchMonitors(zipCode: string): void {
    this.mapsService.searchAddress(zipCode).subscribe(monitors => {
      this._monitors.set(monitors);
    });
  }
}
```

---

### **Task 8: Refatorar MyTelasComponent**
**Prioridade:** 🟡 Média
**Tempo estimado:** 4-5 dias

#### **Problemas:**
- Componente muito grande (735 linhas)
- Múltiplas responsabilidades (ads, attachments, uploads)
- Lógica complexa de tabs
- Acoplamento com muitos serviços

#### **Soluções:**
```typescript
// 1. Separar em componentes menores
@Component({
  selector: 'app-my-telas',
  template: `
    <p-tabView [(activeIndex)]="activeTabIndex">
      <p-tabPanel header="My Ads">
        <app-my-ads [ads]="ads" (adAction)="onAdAction($event)"></app-my-ads>
      </p-tabPanel>
      <p-tabPanel header="Attachments">
        <app-attachments 
          [attachments]="attachments"
          (upload)="onUpload($event)"
          (delete)="onDeleteAttachment($event)">
        </app-attachments>
      </p-tabPanel>
    </p-tabView>
  `
})
export class MyTelasComponent {
  activeTabIndex = 0;
  ads: Ad[] = [];
  attachments: Attachment[] = [];
  
  constructor(private myTelasService: MyTelasService) {}
}

// 2. Criar componentes específicos
@Component({
  selector: 'app-my-ads',
  template: `
    <div class="ads-grid">
      <app-ad-item 
        *ngFor="let ad of ads"
        [ad]="ad"
        (edit)="onEdit(ad)"
        (delete)="onDelete(ad)">
      </app-ad-item>
    </div>
  `
})
export class MyAdsComponent {
  @Input() ads: Ad[] = [];
  @Output() adAction = new EventEmitter<AdAction>();
}

// 3. Criar service para lógica de negócio
@Injectable()
export class MyTelasService {
  private readonly _ads = signal<Ad[]>([]);
  private readonly _attachments = signal<Attachment[]>([]);
  
  readonly ads = this._ads.asReadonly();
  readonly attachments = this._attachments.asReadonly();
  
  constructor(
    private adService: AdService,
    private attachmentService: AttachmentService
  ) {}
  
  async loadUserData(): Promise<void> {
    const [ads, attachments] = await Promise.all([
      this.adService.getUserAds().toPromise(),
      this.attachmentService.getUserAttachments().toPromise()
    ]);
    
    this._ads.set(ads);
    this._attachments.set(attachments);
  }
}
```

---

## 📁 **MÓDULO: ADMIN**

### **Task 9: Refatorar ManagementMonitorsComponent**
**Prioridade:** 🟡 Média
**Tempo estimado:** 4-5 dias

#### **Problemas:**
- Componente muito grande (674 linhas)
- Múltiplas responsabilidades (CRUD, upload, validação)
- Lógica complexa de modais
- Acoplamento com muitos serviços

#### **Soluções:**
```typescript
// 1. Separar em componentes menores
@Component({
  selector: 'app-management-monitors',
  template: `
    <app-monitors-list 
      [monitors]="monitors"
      (edit)="onEditMonitor($event)"
      (delete)="onDeleteMonitor($event)">
    </app-monitors-list>
    
    <app-create-monitor-modal 
      #createModal
      (created)="onMonitorCreated($event)">
    </app-create-monitor-modal>
    
    <app-edit-monitor-modal 
      #editModal
      [monitor]="selectedMonitor"
      (updated)="onMonitorUpdated($event)">
    </app-edit-monitor-modal>
  `
})
export class ManagementMonitorsComponent {
  monitors: Monitor[] = [];
  selectedMonitor: Monitor | null = null;
  
  constructor(private monitorsService: MonitorsService) {}
}

// 2. Criar service para lógica de negócio
@Injectable()
export class MonitorsService {
  private readonly _monitors = signal<Monitor[]>([]);
  readonly monitors = this._monitors.asReadonly();
  
  constructor(private monitorRepository: MonitorRepository) {}
  
  async loadMonitors(): Promise<void> {
    const monitors = await this.monitorRepository.findAll().toPromise();
    this._monitors.set(monitors);
  }
  
  async createMonitor(monitorData: CreateMonitorRequest): Promise<Monitor> {
    const monitor = await this.monitorRepository.create(monitorData).toPromise();
    this._monitors.update(monitors => [...monitors, monitor]);
    return monitor;
  }
}
```

---

## 📁 **MÓDULO: APPLICATION**

### **Task 10: Refatorar GuestLadingComponent**
**Prioridade:** 🟢 Baixa
**Tempo estimado:** 1-2 dias

#### **Problemas:**
- Componente muito simples mas pode ser melhorado
- Falta de lazy loading para componentes filhos
- Estrutura pode ser mais modular

#### **Soluções:**
```typescript
// 1. Implementar lazy loading
@Component({
  selector: 'app-guest-landing',
  template: `
    <app-guest-header></app-guest-header>
    <app-hero-section></app-hero-section>
    <app-features-section></app-features-section>
    <app-mapper-animate></app-mapper-animate>
    <app-how-it-works></app-how-it-works>
    <app-guest-footer></app-guest-footer>
  `
})
export class GuestLandingComponent {}

// 2. Criar componentes menores e mais focados
@Component({
  selector: 'app-hero-section',
  template: `
    <section class="hero">
      <div class="hero-content">
        <h1>{{ heroTitle }}</h1>
        <p>{{ heroDescription }}</p>
        <app-cta-buttons></app-cta-buttons>
      </div>
    </section>
  `
})
export class HeroSectionComponent {
  heroTitle = 'Find Digital Screens Near You';
  heroDescription = 'Discover available digital advertising screens in your target locations.';
}
```

---

## 🔧 **MELHORIAS DE INFRAESTRUTURA**

### **Task 11: Implementar State Management**
**Prioridade:** 🔴 Alta
**Tempo estimado:** 3-4 dias

#### **Problemas:**
- Estado espalhado por múltiplos serviços
- Falta de gerenciamento centralizado
- Dificuldade para debuggar estado
- Inconsistências entre componentes

#### **Soluções:**
```typescript
// 1. Implementar NgRx ou Akita
// Usando NgRx como exemplo

// 2. Criar stores específicos
@Injectable()
export class ClientStore extends ComponentStore<ClientState> {
  constructor() {
    super(initialClientState);
  }
  
  readonly loadClient = this.effect((clientId$: Observable<string>) =>
    clientId$.pipe(
      switchMap(id => this.clientService.getById(id)),
      tap(client => this.patchState({ client, loading: false }))
    )
  );
  
  readonly updateClient = this.updater((state, client: Client) => ({
    ...state,
    client: { ...state.client, ...client }
  }));
}

// 3. Criar selectors
export const selectClient = (state: ClientState) => state.client;
export const selectClientLoading = (state: ClientState) => state.loading;
```

---

### **Task 12: Implementar Lazy Loading**
**Prioridade:** 🟡 Média
**Tempo estimado:** 2-3 dias

#### **Problemas:**
- Todos os módulos carregam na inicialização
- Bundle size muito grande
- Performance inicial ruim

#### **Soluções:**
```typescript
// 1. Implementar lazy loading nas rotas
const routes: Routes = [
  {
    path: 'client',
    loadChildren: () => import('./modules/client/client.module').then(m => m.ClientModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./modules/admin/admin.module').then(m => m.AdminModule)
  }
];

// 2. Implementar lazy loading de componentes
@Component({
  selector: 'app-lazy-component',
  template: `
    <ng-container *ngIf="isLoaded">
      <ng-container *ngComponentOutlet="componentRef"></ng-container>
    </ng-container>
  `
})
export class LazyComponent {
  componentRef: Type<any> | null = null;
  isLoaded = false;
  
  async loadComponent(): Promise<void> {
    const module = await import('./lazy-module');
    this.componentRef = module.LazyComponent;
    this.isLoaded = true;
  }
}
```

---

### **Task 13: Implementar Testing**
**Prioridade:** 🟡 Média
**Tempo estimado:** 5-6 dias

#### **Problemas:**
- Falta de testes unitários
- Falta de testes de integração
- Falta de testes E2E
- Cobertura de código baixa

#### **Soluções:**
```typescript
// 1. Implementar testes unitários
describe('ClientService', () => {
  let service: ClientService;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClientService]
    });
    service = TestBed.inject(ClientService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  it('should create client', () => {
    const clientData = { name: 'Test Client' };
    const expectedClient = { id: '1', ...clientData };
    
    service.createClient(clientData).subscribe(client => {
      expect(client).toEqual(expectedClient);
    });
    
    const req = httpMock.expectOne('/api/clients');
    expect(req.request.method).toBe('POST');
    req.flush(expectedClient);
  });
});

// 2. Implementar testes de componente
describe('ClientViewComponent', () => {
  let component: ClientViewComponent;
  let fixture: ComponentFixture<ClientViewComponent>;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ClientViewComponent],
      providers: [
        { provide: GoogleMapsService, useValue: mockGoogleMapsService },
        { provide: GeolocationService, useValue: mockGeolocationService }
      ]
    });
    fixture = TestBed.createComponent(ClientViewComponent);
    component = fixture.componentInstance;
  });
  
  it('should initialize map with user location', async () => {
    spyOn(mockGeolocationService, 'getCurrentPosition').and.returnValue(
      Promise.resolve({ latitude: 40.7128, longitude: -74.0060 })
    );
    
    await component.ngOnInit();
    
    expect(component.mapCenter).toEqual({ lat: 40.7128, lng: -74.0060 });
  });
});
```

---

## 📊 **PRIORIZAÇÃO E CRONOGRAMA**

### **Sprint 1 (Semana 1-2) - Fundação**
- ✅ Task 1: Refatorar Services de API
- ✅ Task 2: Implementar Error Handling Centralizado
- ✅ Task 3: Refatorar Authentication Service

### **Sprint 2 (Semana 3-4) - Componentes Core**
- ✅ Task 4: Refatorar MapsComponent
- ✅ Task 5: Refatorar HeaderComponent
- ✅ Task 6: Refatorar Sidebar Components

### **Sprint 3 (Semana 5-6) - Módulos de Negócio**
- ✅ Task 7: Refatorar ClientViewComponent
- ✅ Task 8: Refatorar MyTelasComponent
- ✅ Task 9: Refatorar ManagementMonitorsComponent

### **Sprint 4 (Semana 7-8) - Infraestrutura**
- ✅ Task 10: Refatorar GuestLadingComponent
- ✅ Task 11: Implementar State Management
- ✅ Task 12: Implementar Lazy Loading

### **Sprint 5 (Semana 9-10) - Qualidade**
- ✅ Task 13: Implementar Testing
- ✅ Refatorações finais
- ✅ Documentação

---

## 🎯 **MÉTRICAS DE SUCESSO**

### **Antes das Melhorias:**
- ❌ Bundle size: ~2.5MB
- ❌ First Contentful Paint: ~3.5s
- ❌ Cobertura de testes: ~5%
- ❌ Complexidade ciclomática média: ~15
- ❌ Acoplamento: Alto

### **Após as Melhorias:**
- ✅ Bundle size: ~1.2MB
- ✅ First Contentful Paint: ~1.5s
- ✅ Cobertura de testes: ~80%
- ✅ Complexidade ciclomática média: ~8
- ✅ Acoplamento: Baixo

---

## 📝 **NOTAS IMPORTANTES**

1. **Implementação Gradual**: Implementar as melhorias de forma incremental para não quebrar a aplicação
2. **Testes**: Sempre escrever testes antes de refatorar
3. **Documentação**: Manter documentação atualizada durante as mudanças
4. **Code Review**: Todas as mudanças devem passar por code review
5. **Backup**: Manter backup do código antes de grandes refatorações

---

## 🔗 **RECURSOS ÚTEIS**

- [Angular Style Guide](https://angular.io/guide/styleguide)
- [NgRx Documentation](https://ngrx.io/)
- [Angular Testing Guide](https://angular.io/guide/testing)
- [RxJS Best Practices](https://rxjs.dev/guide/overview)
- [Angular Performance Guide](https://angular.io/guide/performance-checklist)

---

**Total estimado: 10 semanas (40-50 dias úteis)**
**Prioridade geral: 🔴 Alta**
**Complexidade: 🟡 Média-Alta**

