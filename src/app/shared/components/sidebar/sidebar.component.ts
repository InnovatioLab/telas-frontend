import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { AutenticacaoService } from "@app/core/service/api/autenticacao.service";
import { AutenticacaoStorage } from "@app/core/service/auth/autenticacao-storage";
import { User } from "@app/model/dto/user";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { DialogoUtils } from "@app/shared/utils/dialogo-config.utils";
import { DIALOGOS } from "@app/shared/utils/dialogos";
import { TEXTO_ACAO } from "@app/utility/src";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { IconDashboardComponent } from "../../icons/dashboard.icon";
import { IconDocumentoComponent } from "../../icons/documento.icon";
import { IconSairComponent } from "../../icons/sair.icon";
import { DialogoComponent } from "../dialogo/dialogo.component";

@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.scss"],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PrimengModule,
    IconDashboardComponent,
    IconDocumentoComponent,
    IconSairComponent,
  ],
})
export class SidebarComponent implements OnInit {
  menuItems = [
    { label: "Dashboard", icon: "dashboard", navegacao: "/" },
    { label: "Documents", icon: "documentos", navegacao: "/documentos" },
    { label: "Logout", icon: "sair", command: () => this.verificarLogout() },
  ];

  aberta = false;
  usuario: User | null;
  corIconeMenu = getComputedStyle(document.documentElement)
    .getPropertyValue("--cor-branca")
    .trim();

  ref: DynamicDialogRef | undefined;

  constructor(
    private readonly autenticacao: AutenticacaoService,
    public dialogService: DialogService,
    private readonly router: Router
  ) {}

  toggleSidebar() {
    this.aberta = !this.aberta;
  }

  ngOnInit() {
    this.usuario = this.autenticacao.user;
  }

  tagNome(): string {
    if (!this.usuario?.nome) {
      return "";
    }

    const partes = this.usuario.nome
      .trim()
      .split(" ")
      .filter((p) => p);

    if (partes.length === 1) {
      return partes[0][0].toUpperCase();
    }

    const primeiraLetra = partes[0][0].toUpperCase();
    const segundaLetra = partes[partes.length - 1][0].toUpperCase();

    return primeiraLetra + segundaLetra;
  }

  logout() {
    AutenticacaoStorage.clearToken();
    this.router.navigate(["/logout"]);
  }

  verificarLogout() {
    const descricao = DIALOGOS.sairSistema;

    const config = DialogoUtils.criarConfig({
      titulo: "Confirm Logout",
      descricao: descricao,
      icon: "report",
      acaoPrimaria: TEXTO_ACAO.simSair,
      acaoPrimariaCallback: () => {
        this.ref.close();
        this.logout();
      },
      acaoSecundaria: TEXTO_ACAO.naoVoltar,
      acaoSecundariaCallback: () => {
        this.ref.close();
      },
    });
    this.ref = this.dialogService.open(DialogoComponent, config);
  }
}
