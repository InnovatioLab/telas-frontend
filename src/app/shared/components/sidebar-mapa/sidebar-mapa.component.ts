import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit, Inject } from '@angular/core';
import { PrimengModule } from '../../primeng/primeng.module';
import { Subscription } from 'rxjs';
import { Environment } from 'src/environments/environment';
import { ENVIRONMENT } from 'src/environments/environment-token';
import { GoogleMapsService } from '@app/core/service/api/google-maps.service';
import { MapPoint } from '@app/core/service/state/map-point.interface';
import { IconsModule } from '@app/shared/icons/icons.module';

@Component({
  selector: 'app-sidebar-mapa',
  standalone: true,
  imports: [CommonModule, PrimengModule, IconsModule],
  templateUrl: './sidebar-mapa.component.html',
  styleUrls: ['./sidebar-mapa.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SidebarMapaComponent implements OnInit, OnDestroy {
  visibilidadeSidebar = false;
  pontoSelecionado: MapPoint | null = null;
  streetViewUrl: string | null = null;
  carregandoImagem = false;
  erroImagem = false;
  
  private readonly subscriptions = new Subscription();
  
  constructor(
    private readonly mapsService: GoogleMapsService,
    @Inject(ENVIRONMENT) private readonly env: Environment
  ) {}
  
  ngOnInit(): void {
    this.subscriptions.add(
      this.mapsService.selectedPoint$.subscribe(point => {
        if (point) {
          this.pontoSelecionado = point;
          this.abrirSidebar();
          this.carregarImagemStreetView();
        }
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  abrirSidebar(): void {
    this.visibilidadeSidebar = true;
  }
  
  fecharSidebar(): void {
    this.visibilidadeSidebar = false;
    this.mapsService.selectPoint(null);
    this.streetViewUrl = null;
  }
  
  voltar(): void {
    this.fecharSidebar();
  }
  
  private carregarImagemStreetView(): void {
    if (!this.pontoSelecionado) return;
    
    this.carregandoImagem = true;
    this.erroImagem = false;
    
    const { latitude, longitude } = this.pontoSelecionado;
    const tamanho = '800x350';
    const fov = '80';
    const pitch = '0';
    const heading = '70';
    
    const apiKeyParam = this.env.googleMapsApiKey ? `&key=${this.env.googleMapsApiKey}` : '';
    
    this.streetViewUrl = `https://maps.googleapis.com/maps/api/streetview?size=${tamanho}&location=${latitude},${longitude}&fov=${fov}&heading=${heading}&pitch=${pitch}${apiKeyParam}`;
    
    setTimeout(() => {
      this.carregandoImagem = false;
    }, 800);
  }
  
  tratarErroImagem(): void {
    this.erroImagem = true;
    this.carregandoImagem = false;
  }
  
  abrirGoogleMaps(): void {
    if (!this.pontoSelecionado) return;
    
    const { latitude, longitude } = this.pontoSelecionado;
    const titulo = encodeURIComponent(this.pontoSelecionado.title || 'Local Selecionado');
    
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${titulo}`;
    
    window.open(url, '_blank');
  }
}
