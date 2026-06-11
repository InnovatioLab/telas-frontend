import { computed, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  _visibilitySignal = signal<boolean | null>(false);
  _typeSignal = signal<string | null>(null);
  _modeSignal = signal<string | null>(null);
  _identifierSignal = signal<string | null>(null);

  visibility = this._visibilitySignal.asReadonly();
  type = this._typeSignal.asReadonly();
  mode = this._modeSignal.asReadonly();
  identifier = this._identifierSignal.asReadonly();

  isSidebarOpen = computed(() => !!this.visibility());

  onListUpdate: Subject<void> = new Subject();

  view(tipo: string, identificador: string) {
    this._visibilitySignal.update(() => true);
    this._typeSignal.update(() => tipo);
    this._modeSignal.update(() => 'view');
    this._identifierSignal.update(() => identificador);
    this.notifyChange();
  }

  criar(tipo: string) {
    this._visibilitySignal.update(() => true);
    this._typeSignal.update(() => tipo);
    this._modeSignal.update(() => 'create');
    this.notifyChange();
  }

  update(tipo: string, identificador: string) {
    this._visibilitySignal.update(() => true);
    this._typeSignal.update(() => tipo);
    this._modeSignal.update(() => 'update');
    this._identifierSignal.update(() => identificador);
    this.notifyChange();
  }

  openMenu(tipo: string) {
    this._visibilitySignal.update(() => true);
    this._typeSignal.update(() => tipo);
    this._modeSignal.update(() => 'menu');
    this.notifyChange();
  }

  notifyChange() {
    this.onListUpdate.next();
  }

  close() {
    this._visibilitySignal.update(() => false);
    this.notifyChange();
  }
}
