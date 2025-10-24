import { CommonModule } from "@angular/common";
import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { Router } from "@angular/router";
import { ClientService } from "@app/core/service/api/client.service";
import { TermoCondicaoService } from "@app/core/service/api/termo-condicao.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { TermoCondicao } from "@app/model/termo-condicao";
import { DialogoUtils } from "@app/shared/utils/dialogo-config.utils";
import { MENSAGENS } from "@app/utility/src";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { PrimengModule } from "../../primeng/primeng.module";
import { DialogoComponent } from "./../dialogo/dialogo.component";

@Component({
  selector: "ui-termos",
  standalone: true,
  imports: [CommonModule, PrimengModule],
  providers: [DialogService],
  templateUrl: "./termos.component.html",
  styleUrls: ["./termos.component.scss"],
})
export class TermosComponent implements OnInit {
  @Output() isAceitouTermo = new EventEmitter<boolean>();
  conteudo: string;
  dialogoRef: DynamicDialogRef | undefined;
  MENSAGENS = MENSAGENS;
  exibir = true;
  isMobile = false;

  constructor(
    private router: Router,
    private readonly service: TermoCondicaoService,
    private readonly clientService: ClientService,
    private authentication: Authentication,
    private dialogService: DialogService
  ) {}

  ngOnInit() {
    this.service.pegarTermoCondicao().subscribe((res: TermoCondicao) => {
      this.conteudo = res.content;
    });
    this.checkScreenSize();
    window.addEventListener("resize", () => this.checkScreenSize());
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
  }

  recusar() {
    this.exibirAlerta();
  }

  aceitar() {
    this.clientService.aceitarTermosDeCondicao().subscribe(() => {
      this.emitirResposta(true);
      this.router.navigate(["/client"]);
    });
  }

  exibirAlerta() {
    const mensagem = this.isMobile
      ? this.MENSAGENS.dialogo.recusarTermoMobile
      : this.MENSAGENS.dialogo.recusarTermo;
    const config = DialogoUtils.exibirAlerta(mensagem, {
      acaoPrimaria: "Yes, Decline",
      acaoPrimariaCallback: () => {
        this.dialogoRef?.close();
        this.emitirResposta(false);
        this.router.navigate(["/login"]);
      },
      acaoSecundaria: "No, Go Back",
      acaoSecundariaCallback: () => {
        this.dialogoRef?.close();
      },
    });

    this.dialogoRef = this.dialogService.open(DialogoComponent, config);
  }

  emitirResposta(resposta: boolean) {
    this.isAceitouTermo.emit(resposta);
  }
}
