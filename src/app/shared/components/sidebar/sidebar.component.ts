import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { AuthenticationService } from "@app/core/service/api/authentication.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { User } from "@app/model/dto/user";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { DialogUtils } from "@app/shared/utils/dialog-config.utils";
import { DIALOGS } from "@app/shared/utils/dialogs";
import { ACTION_LABELS } from "@app/utility/src";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { IconDashboardComponent } from "../../icons/dashboard.icon";
import { IconDocumentoComponent } from "../../icons/documento.icon";
import { IconSairComponent } from "../../icons/sair.icon";
import { DialogComponent } from "../dialog/dialog.component";

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
    private readonly autenticacao: AuthenticationService,
    private readonly authentication: Authentication,
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
    this.autenticacao.logout();
    this.authentication.removerAutenticacao();
    window.location.href = "/";
  }

  verificarLogout() {
    const descricao = DIALOGS.sairSistema;

    const config = DialogUtils.createConfig({
      title: "Confirm Logout",
      description: descricao,
      icon: "report",
      primaryAction: ACTION_LABELS.confirmLogout,
      primaryActionCallback: () => {
        this.ref.close();
        this.logout();
      },
      secondaryAction: ACTION_LABELS.cancelGoBack,
      secondaryActionCallback: () => {
        this.ref.close();
      },
    });
    this.ref = this.dialogService.open(DialogComponent, config);
  }
}
