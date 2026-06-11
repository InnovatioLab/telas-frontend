import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ClientService } from '@app/core/service/api/client.service';
import { TermsConditionsService } from '@app/core/service/api/terms-conditions.service';
import { Authentication } from '@app/core/service/auth/autenthication';
import { Role } from '@app/model/client';
import { TermsConditions } from '@app/model/terms-conditions';
import { DialogUtils } from '@app/shared/utils/dialog-config.utils';
import { MESSAGES } from '@app/utility/src';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PrimengModule } from '../../primeng/primeng.module';
import { DialogComponent } from '../dialog/dialog.component';

@Component({
  selector: 'ui-terms',
  standalone: true,
  imports: [CommonModule, PrimengModule],
  providers: [DialogService],
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss'],
})
export class TermsComponent implements OnInit {
  @Output() isAceitouTermo = new EventEmitter<boolean>();
  conteudo: string;
  dialogoRef: DynamicDialogRef | undefined;
  MESSAGES = MESSAGES;
  show = true;
  isMobile = false;

  constructor(
    private readonly router: Router,
    private readonly service: TermsConditionsService,
    private readonly clientService: ClientService,
    private readonly authentication: Authentication,
    private readonly dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.service.pegarTermsConditions().subscribe((res: TermsConditions) => {
      this.conteudo = res.content;
    });
    this.checkScreenSize();
    window.addEventListener('resize', () => this.checkScreenSize());
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  decline(): void {
    this.showAlert();
  }

  accept(): void {
    this.clientService.aceitarTermosDeCondicao().subscribe(() => {
      this.emitirResposta(true);
      this.authentication.pegarDadosAutenticado().then(() => {
        const client = this.authentication._clientSignal();
        if (client?.role === Role.ADMIN) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/client']);
        }
      });
    });
  }

  showAlert(): void {
    const message = this.isMobile
      ? this.MESSAGES.dialog.declineTermsMobile
      : this.MESSAGES.dialog.declineTerms;
    const config = DialogUtils.showAlert(message, {
      primaryAction: 'Yes, Decline',
      primaryActionCallback: () => {
        this.dialogoRef?.close();
        this.emitirResposta(false);
        this.router.navigate(['/auth/login']);
      },
      secondaryAction: 'No, Go Back',
      secondaryActionCallback: () => {
        this.dialogoRef?.close();
      },
    });

    this.dialogoRef = this.dialogService.open(DialogComponent, config);
  }

  emitirResposta(response: boolean): void {
    this.isAceitouTermo.emit(response);
  }
}
