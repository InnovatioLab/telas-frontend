import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { CommonModule } from '@angular/common';
import { ToastComponent } from './shared/components/toast/toast.component';
import packageJson from '../../package.json';
import { DotsLoadingComponent } from "./shared/components/dots-loading/dots-loading.component";
import { PrimengModule } from './shared/primeng/primeng.module';
import { DialogoUtils } from './shared/utils/dialogo-config.utils';
import { DIALOGOS } from './shared/utils/dialogos';
import { TEXTO_ACAO } from './utility/src';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DialogoComponent } from './shared/components/dialogo/dialogo.component';
import { AutenticacaoStorage } from './core/service/auth/autenticacao-storage';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PrimengModule, RouterModule, ToastModule, ConfirmDialogModule, ToastComponent, DotsLoadingComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Telas';
  public version: string = packageJson.version;
  ref: DynamicDialogRef | undefined;

  constructor(
    private readonly router: Router,
    public dialogService: DialogService,
  ) {
    window.addEventListener('popstate', (event) => {
      if (window.location.pathname === '/login') {
        event.preventDefault();
        this.verificarLogout();
        history.go(1);
      }
    });
  }

  logout(){
    AutenticacaoStorage.clearToken()
    this.router.navigate(['/logout']);
  }

  verificarLogout() {
    const descricao = DIALOGOS.sairSistema;

    const config = DialogoUtils.criarConfig({
      titulo: 'Confirmar Logout',
      descricao: descricao,
      icon: 'report',
      acaoPrimaria: TEXTO_ACAO.simSair,
      acaoPrimariaCallback: () => {
        this.ref.close();
        this.logout();
      },
      acaoSecundaria: TEXTO_ACAO.naoVoltar,
      acaoSecundariaCallback: () => {
        this.ref.close();
      }
    });
    this.ref = this.dialogService.open(DialogoComponent, config);
  }
}
