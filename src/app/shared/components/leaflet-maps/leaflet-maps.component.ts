import { AfterViewInit, Component, ElementRef, inject, NgZone, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Configuração dos ícones do Leaflet
const DefaultIcon = L.icon({
  iconUrl: './assets/leaflet/marker-icon.png',
  iconRetinaUrl: './assets/leaflet/marker-icon-2x.png',
  shadowUrl: './assets/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

// Definir o ícone padrão para todos os marcadores
L.Marker.prototype.options.icon = DefaultIcon;

@Component({
  selector: 'app-leaflet-maps',
  templateUrl: './leaflet-maps.component.html',
  styleUrls: ['./leaflet-maps.component.scss'],
  encapsulation: ViewEncapsulation.None,
  styles: [`
    .leaflet-container {
      width: 100%;
      height: 100%;
      z-index: 1;
    }
    .leaflet-tile-pane {
      z-index: 1;
      opacity: 1 !important;
    }
    .leaflet-tile {
      opacity: 1 !important;
    }
  `]
})
export class LeafletMapsComponent implements AfterViewInit, OnDestroy {
  readonly ngZone = inject(NgZone);

  @ViewChild('map') mapContainer!: ElementRef<HTMLElement>;
  private mapInstance?: L.Map;

  private initialized = false;

  ngAfterViewInit(): void {
    // Pequeno delay para garantir que o DOM está pronto
    setTimeout(() => {
      if (!this.initialized) {
        this.initialized = true;
        this.initMap();
      }
    }, 0);
  }

  private initMap(): void {
    console.log('[1] Iniciando mapa Leaflet...');
    
    // Limpa instância anterior se existir
    if (this.mapInstance) {
      console.log('[2] Removendo instância anterior do mapa');
      this.mapInstance.remove();
      this.mapInstance = undefined;
    }

    try {
      if (!this.mapContainer) {
        console.error('[3] ERRO: Container do mapa não encontrado');
        return;
      }

      const container = this.mapContainer.nativeElement;
      console.log('[4] Container encontrado:', container);
      console.log('[5] Container dimensões:', {
        offsetWidth: container.offsetWidth,
        offsetHeight: container.offsetHeight,
        clientWidth: container.clientWidth,
        clientHeight: container.clientHeight
      });
      
      // Força as dimensões do container
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.display = 'block';
      
      console.log('[6] Criando instância do mapa...');
      this.mapInstance = L.map('mapa', {
        center: [-15.7801, -47.9292],
        zoom: 13,
        zoomControl: true,
        attributionControl: true
      });
      console.log('[7] Mapa criado:', this.mapInstance);

      // Força uma atualização inicial do tamanho
      console.log('[8] Forçando atualização inicial do tamanho');
      this.mapInstance.invalidateSize(true);

      // Adiciona a camada de tiles do OpenStreetMap
      console.log('[9] Iniciando adição da camada de tiles');
      const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
        className: 'map-tiles'
      });

      console.log('[10] Adicionando camada de tiles ao mapa');
      tileLayer.addTo(this.mapInstance);

      // Força nova atualização após os tiles serem adicionados
      console.log('[11] Forçando nova atualização do tamanho');
      this.mapInstance.invalidateSize(true);
      
      // Registra eventos para debug
      this.mapInstance.on('load', () => console.log('[Evento] Mapa carregado'));
      this.mapInstance.on('tileloadstart', (e) => console.log('[Evento] Iniciando carregamento de tiles', e));
      this.mapInstance.on('tileload', (e) => console.log('[Evento] Tile carregado:', e));
      this.mapInstance.on('tileerror', (e) => console.error('[Evento] ERRO ao carregar tile:', e));

      // Registra eventos adicionais
      tileLayer.on('loading', () => console.log('[TileLayer] Iniciando carregamento'));
      tileLayer.on('load', () => console.log('[TileLayer] Carregamento completo'));
      tileLayer.on('tileloadstart', (e) => console.log('[TileLayer] Iniciando carregamento do tile:', e));
      tileLayer.on('tileload', (e) => console.log('[TileLayer] Tile carregado:', e));
      tileLayer.on('tileerror', (e) => console.error('[TileLayer] ERRO ao carregar tile:', e));

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
      console.error('Erro ao inicializar mapa:', error);
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
