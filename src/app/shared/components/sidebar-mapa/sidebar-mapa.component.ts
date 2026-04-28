import { CommonModule } from "@angular/common";
import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Inject,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { SliceStringPipe } from "@app/core/pipes/slice-string.pipe";
import { ClientService } from "@app/core/service/api/client.service";
import { GoogleMapsService } from "@app/core/service/api/google-maps.service";
import { MonitorCartActionsService } from "@app/core/service/domain/monitor-cart-actions.service";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { ToastService } from "@app/core/service/state/toast.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { isClientShoppingRole } from "@app/model/client";
import { IconCheckComponent } from "@app/shared/icons/check.icon";
import { IconClockComponent } from "@app/shared/icons/clock.icon";
import { IconsModule } from "@app/shared/icons/icons.module";
import { IconWarningComponent } from "@app/shared/icons/warning.icon";
import { resolvePhotoUrl } from "@app/shared/utils/photo-url.utils";
import { Subscription } from "rxjs";
import { ENVIRONMENT } from "src/environments/environment-token";
import { Environment } from "src/environments/environment";
import { PrimengModule } from "../../primeng/primeng.module";

@Component({
  selector: "app-sidebar-mapa",
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
    IconsModule,
    IconCheckComponent,
    IconWarningComponent,
    IconClockComponent,
    SliceStringPipe,
  ],
  templateUrl: "./sidebar-mapa.component.html",
  styleUrls: ["./sidebar-mapa.component.scss"],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SidebarMapaComponent implements OnInit, OnDestroy {
  visibilidadeSidebar = false;
  pontoSelecionado: MapPoint | null = null;
  private locationPhotoFailed = false;

  localInfo: {
    name?: string;
    description?: string;
    formattedAddress?: string;
  } | null = null;
  loadingLocationInfo = false;

  private readonly subscriptions = new Subscription();

  constructor(
    private readonly mapsService: GoogleMapsService,
    private readonly monitorCartActions: MonitorCartActionsService,
    @Inject(ENVIRONMENT) private readonly env: Environment,
    private readonly toastService: ToastService,
    private readonly cdr: ChangeDetectorRef,
    private readonly clientService: ClientService,
    private readonly authentication: Authentication
  ) {}

  get showShoppingActions(): boolean {
    return isClientShoppingRole(this.authentication.client()?.role);
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.mapsService.selectedPoint$.subscribe((point) => {
        if (point && !this.pontoSelecionado) {
          this.resetLocationPhotoState();
          this.pontoSelecionado = point;
          this.openSidebar();
          setTimeout(() => {
            this.cdr.detectChanges();
          }, 100);
        }
      })
    );

    window.addEventListener("monitor-marker-clicked", ((e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.point && !this.pontoSelecionado) {
        this.resetLocationPhotoState();
        this.pontoSelecionado = customEvent.detail.point;
        this.openSidebar();
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 100);
      }
    }) as EventListener);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  openSidebar(): void {
    this.visibilidadeSidebar = true;
  }

  closeSidebar(): void {
    this.visibilidadeSidebar = false;
    this.mapsService.selectPoint(null);
    this.localInfo = null;
    this.pontoSelecionado = null;
    this.resetLocationPhotoState();
  }

  voltar(): void {
    this.closeSidebar();
  }

  getMonitorData(): any {
    if (this.pontoSelecionado?.data) {
      return this.pontoSelecionado.data;
    }
    return null;
  }

  addToList(): void {
    if (this.pontoSelecionado) {
      const monitorToAdd = this.pontoSelecionado;
      this.monitorCartActions.addMonitorToCart(monitorToAdd);
      this.closeSidebar();
    }
  }

  addToWishlist(): void {
    if (this.pontoSelecionado) {
      const monitorToAdd = this.pontoSelecionado;
      this.clientService.addToWishlist(monitorToAdd.id).subscribe({
        next: () => {
          this.toastService.sucesso("Screen added to wishlist");
        },
        error: (error) => {
          this.toastService.erro("Error adding to wishlist");
        },
      });
    }
  }

  resolveLocationPhotoUrl(): string | null {
    const data = this.getMonitorData();
    const raw = data?.photoUrl ?? this.pontoSelecionado?.photoUrl;
    return resolvePhotoUrl({ apiUrl: this.env.apiUrl, photoUrl: raw });
  }

  canShowLocationPhoto(): boolean {
    const url = this.resolveLocationPhotoUrl();
    return url != null && url.length > 0 && !this.locationPhotoFailed;
  }

  onLocationPhotoError(): void {
    this.locationPhotoFailed = true;
    this.cdr.detectChanges();
  }

  private resetLocationPhotoState(): void {
    this.locationPhotoFailed = false;
  }
}
