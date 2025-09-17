import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, ViewEncapsulation, inject, NgZone } from '@angular/core';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';

@Component({
  selector: 'app-leaflet-maps',
  standalone: true,
  imports: [CommonModule, LeafletModule],
  template: `
    <div class="map-container"
         leaflet
         [leafletOptions]="options"
         (leafletMapReady)="onMapReady($event)">
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    
    .map-container {
      width: 100%;
      height: 100%;
      min-height: 400px;
      background: #ddd;
    }
  `],
  encapsulation: ViewEncapsulation.None,
})
export class LeafletMapsComponent implements AfterViewInit, OnDestroy {
  readonly ngZone = inject(NgZone);

  @ViewChild('map') mapContainer!: ElementRef<HTMLElement>;
  private mapInstance?: L.Map;

  options: L.MapOptions = {
    layers: [
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      })
    ],
    zoom: 13,
    center: [-15.7801, -47.9292] as L.LatLngExpression
  };

  onMapReady(map: L.Map) {
    this.mapInstance = map;
  }

  private initialized = false;

  ngAfterViewInit(): void {
    if (!this.initialized) {
      this.initialized = true;


      if (this.mapContainer) {
        const container = this.mapContainer.nativeElement;
        container.style.cssText = `
          width: 100%;
          height: 100%;
          position: relative;
          display: block;
          isolation: isolate;
          background: #ddd;
        `;


        setTimeout(() => {
          this.ngZone.run(() => {
            this.initMap();


            if (this.mapInstance) {
              this.mapInstance.invalidateSize({ animate: false });
              const center = this.mapInstance.getCenter();
              this.mapInstance.setView(center, this.mapInstance.getZoom(), { animate: false });
            }
          });
        });
      }
    }
  }

  private initMap(): void {


    // Limpa instância anterior se existir
    if (this.mapInstance) {

      this.mapInstance.remove();
      this.mapInstance = undefined;
    }

    try {
      if (!this.mapContainer) {

        return;
      }

      const container = this.mapContainer.nativeElement;



      // Força as dimensões do container
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.display = 'block';


      this.mapInstance = L.map('mapa', {
        center: [-15.7801, -47.9292],
        zoom: 13,
        zoomControl: true,
        attributionControl: true
      });


      // Força uma atualização inicial do tamanho

      this.mapInstance.invalidateSize(true);

      // Adiciona a camada de tiles do OpenStreetMap

      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '© OpenStreetMap contributors'
      });


      tileLayer.addTo(this.mapInstance);

      // Força nova atualização após os tiles serem adicionados

      setTimeout(() => this.mapInstance?.invalidateSize(true), 0);

      // Registra eventos para debug


      // Registra eventos adicionais
      tileLayer.on('load', () => {
        // Força a re-renderização APÓS os tiles carregarem
        setTimeout(() => this.mapInstance?.invalidateSize(true), 0);
      });

      // Adiciona um marcador de teste com um pequeno delay para garantir que o mapa esteja estável
      setTimeout(() => {
        if (this.mapInstance) {
          const marker = L.marker([-15.7801, -47.9292], {
            icon: L.icon({
              iconUrl: '/assets/leaflet/marker-icon.png',
              iconRetinaUrl: '/assets/leaflet/marker-icon-2x.png',
              shadowUrl: '/assets/leaflet/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })
          }).addTo(this.mapInstance);

          this.ngZone.run(() => {
            marker.bindPopup("<b>Olá!</b><br>Eu sou um popup.", {
              closeButton: true,
              closeOnClick: false,
              autoClose: false
            }).openPopup();
          });
        }
      }, 1000);
    } catch (error) {

    }
  }

  ngOnDestroy(): void {
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = undefined;
    }
  }

  public getMapInstance(): L.Map | undefined {
    return this.mapInstance;
  }

  public addMarker(lat: number, lng: number, title: string, clickHandler: () => void): void {
    if (!this.mapInstance) return;

    const marker = L.marker([lat, lng], {
      title: title,
    }).addTo(this.mapInstance);

    marker.on('click', () => {
      this.ngZone.run(() => {
        clickHandler();
      });
    });
  }

  public clearMarkers(): void {
    if (!this.mapInstance) return;

    this.mapInstance.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.mapInstance?.removeLayer(layer);
      }
    });
  }
}
