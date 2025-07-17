import { computed, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  _visibilidadeSignal = signal<boolean | null>(false);
  _tipoSignal = signal<string | null>(null);
  _modoSignal = signal<string | null>(null);
  _identificarSignal = signal<string | null>(null);

  visibilidade = this._visibilidadeSignal.asReadonly();
  tipo = this._tipoSignal.asReadonly();
  modo = this._modoSignal.asReadonly();
  identificador = this._identificarSignal.asReadonly();

  sidebarAberta = computed(() => !!this.visibilidade());

  atualizarLista: Subject<void> = new Subject();

  visualizar(tipo: string, identificador: string) {
    this._visibilidadeSignal.update(() => true);
    this._tipoSignal.update(() => tipo);
    this._modoSignal.update(() => 'visualizar');
    this._identificarSignal.update(() => identificador);
    this.emitirMudanca();
  }

  criar(tipo: string) {
    this._visibilidadeSignal.update(() => true);
    this._tipoSignal.update(() => tipo);
    this._modoSignal.update(() => 'criar');
    this.emitirMudanca();
  }

  editar(tipo: string, identificador: string) {
    this._visibilidadeSignal.update(() => true);
    this._tipoSignal.update(() => tipo);
    this._modoSignal.update(() => 'editar');
    this._identificarSignal.update(() => identificador);
    this.emitirMudanca();
  }

  abrirMenu(tipo: string) {
    this._visibilidadeSignal.update(() => true);
    this._tipoSignal.update(() => tipo);
    this._modoSignal.update(() => 'menu');
    this.emitirMudanca();
  }

  emitirMudanca() {
    this.atualizarLista.next();
  }

  fechar() {
    this._visibilidadeSignal.update(() => false);
    this.emitirMudanca();
  }
}
