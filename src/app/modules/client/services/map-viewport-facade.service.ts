import { ChangeDetectorRef, Injectable, NgZone, OnDestroy } from "@angular/core";
import { SearchMonitorsService } from "@app/core/service/api/search-monitors.service";
import { GoogleMapsService } from "@app/core/service/api/google-maps.service";
import { MapPoint } from "@app/core/service/state/map-point.interface";
import { MapsComponent } from "@app/shared/components/maps/maps.component";
import * as L from "leaflet";
import { EMPTY, Observable, Subject, Subscription, timer } from "rxjs";
import {
  debounceTime,
  map,
  switchMap,
  take,
  takeUntil,
  tap,
} from "rxjs/operators";
import { MapViewportCacheService } from "./map-viewport-cache.service";

export interface MapViewportFacadeConnectOptions {
  getMapsComponent: () => MapsComponent | undefined | null;
  googleMapsService: GoogleMapsService;
  ensureMapInitialized?: () => void;
  onMarkersChanged?: (points: MapPoint[]) => void;
}

@Injectable()
export class MapViewportFacadeService implements OnDestroy {
  private readonly viewportMove$ = new Subject<L.Map>();
  private readonly destroy$ = new Subject<void>();
  private viewportMapHandler?: () => void;
  private mapLeafletRef: L.Map | null = null;
  private pipelineSub?: Subscription;
  private viewportInitialFetchScheduled = false;
  private connectOptions?: MapViewportFacadeConnectOptions;

  constructor(
    private readonly viewportCache: MapViewportCacheService,
    private readonly searchMonitorsService: SearchMonitorsService,
    private readonly ngZone: NgZone,
    private readonly cdr: ChangeDetectorRef
  ) {}

  connect(options: MapViewportFacadeConnectOptions): void {
    this.connectOptions = options;
    this.viewportCache.reset();
    this.viewportInitialFetchScheduled = false;
    this.pipelineSub = this.viewportMove$
      .pipe(
        debounceTime(350),
        switchMap((m) => this.handleViewport(m)),
        takeUntil(this.destroy$)
      )
      .subscribe();
    options.ensureMapInitialized?.();
    timer(2000)
      .pipe(takeUntil(this.destroy$), take(1))
      .subscribe(() => this.ensureViewportBootstrapFallback());
  }

  onMapLeafletInitialized(leafletMap: L.Map): void {
    this.cdr.detectChanges();
    this.attachViewportMapHandlers(leafletMap);
  }

  onMapReady(leafletMap: L.Map): void {
    this.cdr.detectChanges();
    this.scheduleInitialViewportFetch(leafletMap);
  }

  onZipSearchWithResults(monitors: MapPoint[], fitBounds: boolean): void {
    this.viewportCache.updateCacheFromZipSearchMonitors(monitors);
    this.connectOptions?.getMapsComponent()?.setMapPoints(monitors, {
      fitBounds,
    });
    this.connectOptions?.googleMapsService.updateNearestMonitors(monitors);
    this.connectOptions?.onMarkersChanged?.(monitors);
  }

  onZipSearchEmpty(): void {
    this.viewportCache.reset();
  }

  focusOnZipCodeLocation(
    zipCode?: string
  ): Promise<{ lat: number; lng: number } | null> {
    let targetZipCode = zipCode;

    if (!targetZipCode) {
      const searchInput = document.getElementById(
        "search-zipcode"
      ) as HTMLInputElement | null;
      targetZipCode = searchInput?.value;
    }

    if (!targetZipCode || targetZipCode.length !== 5) {
      return Promise.resolve(null);
    }

    return this.connectOptions!.googleMapsService
      .searchAddress(targetZipCode)
      .then((result) => {
        if (!result) {
          return null;
        }

        const zipCodePoint: MapPoint = {
          id: `zipcode-${targetZipCode}`,
          latitude: result.location.latitude,
          longitude: result.location.longitude,
          title: `ZIP Code ${targetZipCode}`,
          locationDescription: result.formattedAddress,
          type: "ZIPCODE",
          category: "ZIPCODE",
        };

        const center = {
          lat: result.location.latitude,
          lng: result.location.longitude,
        };

        this.connectOptions?.getMapsComponent()?.setMapPoints([zipCodePoint]);
        this.connectOptions
          ?.getMapsComponent()
          ?.fitBoundsToPoints([zipCodePoint]);
        this.connectOptions?.googleMapsService.updateNearestMonitors([
          zipCodePoint,
        ]);
        this.connectOptions?.onMarkersChanged?.([zipCodePoint]);
        this.triggerViewportFromMap();

        return center;
      })
      .catch((): null => null);
  }

  triggerViewportFromMap(): void {
    const leafletMap = this.connectOptions?.getMapsComponent()?.getLeafletMap();
    if (leafletMap) {
      this.ngZone.run(() => this.viewportMove$.next(leafletMap));
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.detachViewportMapHandlers();
    this.pipelineSub?.unsubscribe();
  }

  private scheduleInitialViewportFetch(leafletMap: L.Map): void {
    if (this.viewportInitialFetchScheduled) {
      return;
    }
    this.viewportInitialFetchScheduled = true;
    this.attachViewportMapHandlers(leafletMap);
    timer(120)
      .pipe(takeUntil(this.destroy$), take(1))
      .subscribe(() =>
        this.ngZone.run(() => this.viewportMove$.next(leafletMap))
      );
  }

  private ensureViewportBootstrapFallback(): void {
    if (this.viewportInitialFetchScheduled) {
      return;
    }
    const leafletMap = this.connectOptions?.getMapsComponent()?.getLeafletMap();
    if (!leafletMap) {
      return;
    }
    this.scheduleInitialViewportFetch(leafletMap);
  }

  private attachViewportMapHandlers(map: L.Map): void {
    this.detachViewportMapHandlers();
    this.mapLeafletRef = map;
    this.viewportMapHandler = () =>
      this.ngZone.run(() => this.viewportMove$.next(map));
    map.on("moveend", this.viewportMapHandler);
    map.on("zoomend", this.viewportMapHandler);
  }

  private detachViewportMapHandlers(): void {
    if (this.mapLeafletRef && this.viewportMapHandler) {
      this.mapLeafletRef.off("moveend", this.viewportMapHandler);
      this.mapLeafletRef.off("zoomend", this.viewportMapHandler);
    }
    this.mapLeafletRef = null;
    this.viewportMapHandler = undefined;
  }

  private handleViewport(leafletMap: L.Map): Observable<void> {
    const visible = leafletMap.getBounds();
    if (this.viewportCache.isViewportCovered(visible)) {
      this.ngZone.run(() => {
        const points = this.viewportCache.filterPointsInBounds(visible);
        this.connectOptions?.getMapsComponent()?.setMapPoints(points, {
          fitBounds: false,
        });
        this.connectOptions?.googleMapsService.updateNearestMonitors(points);
        this.connectOptions?.onMarkersChanged?.(points);
        this.cdr.markForCheck();
      });
      return EMPTY;
    }
    const req = this.viewportCache.buildRequestBounds(visible);
    return this.searchMonitorsService.findMonitorsInViewport(req).pipe(
      tap((points) => {
        this.ngZone.run(() => {
          if (points.length > 0) {
            this.viewportCache.mergePoints(points);
            this.viewportCache.setCachedBoundsFromRequest(
              req.minLat,
              req.maxLat,
              req.minLng,
              req.maxLng
            );
          } else {
            this.viewportCache.invalidateViewportFetchCache();
          }
          const inView = this.viewportCache.filterPointsInBounds(visible);
          this.connectOptions?.getMapsComponent()?.setMapPoints(inView, {
            fitBounds: false,
          });
          this.connectOptions?.googleMapsService.updateNearestMonitors(inView);
          this.connectOptions?.onMarkersChanged?.(inView);
          this.cdr.markForCheck();
        });
      }),
      map((): void => undefined)
    );
  }
}
