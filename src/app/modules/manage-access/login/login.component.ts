import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AutenticacaoService } from "@app/core/service/api/autenticacao.service";
import { ClientService } from "@app/core/service/api/client.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { AuthenticationStorage } from "@app/core/service/auth/authentication-storage";
import { Client, DefaultStatus, Role } from "@app/model/client";
import { ILoginRequest } from "@app/model/dto/request/login.request";
import { AuthenticatedClientResponseDto } from "@app/model/dto/response/authenticated-client-response.dto";
import { CardCentralizadoComponent, ErrorComponent } from "@app/shared";
import { BaseModule } from "@app/shared/base/base.module";
import { DialogoComponent } from "@app/shared/components/dialogo/dialogo.component";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { DialogoUtils } from "@app/shared/utils/dialogo-config.utils";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { catchError, finalize, of } from "rxjs";
@Component({
  selector: "app-login",
  imports: [
    CommonModule,
    BaseModule,
    PrimengModule,
    CardCentralizadoComponent,
    ErrorComponent,
    IconsModule,
  ],
  standalone: true,
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  logoSrc: string | undefined;
  form: FormGroup;
  ref: DynamicDialogRef | undefined;
  loading = false;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    public dialogService: DialogService,
    private readonly autenticacaoService: AutenticacaoService,
    private readonly clientService: ClientService,
    private readonly authentication: Authentication
  ) {}

  ngOnInit(): void {
    this.iniciarFormulario();
    this.form.markAsPristine();
    this.form.markAsUntouched();
    Object.values(this.form.controls).forEach((control) => {
      control.markAsPristine();
      control.markAsUntouched();
      control.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });
  }

  iniciarFormulario(): void {
    this.form = this.formBuilder.group({
      login: ["", [Validators.required]],
      senha: [
        "",
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(32),
        ],
      ],
    });
  }

  login(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { login, senha } = this.form.value;

    const payload: ILoginRequest = {
      username: login,
      password: senha,
    };

    this.autenticacaoService
      .login(payload)
      .pipe(
        finalize(() => (this.loading = false)),
        catchError((error) => {
          this.mensagemLoginInvalidoDialog();
          return of(null);
        })
      )
      .subscribe((response) => {
        if (response && response.client) {
          const r = response as {
            token?: string;
            accessToken?: string;
            refreshToken?: string;
            client: AuthenticatedClientResponseDto;
          };

          const accessToken = r.accessToken ?? r.token;
          if (accessToken) {
            AuthenticationStorage.setToken(accessToken);
          }
          if (r.refreshToken) {
            AuthenticationStorage.setRefreshToken(r.refreshToken);
          }

          const client = this.toClient(r.client);
          this.clientService.setClientAtual(client);
          this.authentication.updateClientData(client);

          if (r.client.termAccepted) {
            this.redirecionarParaHome(r.client);
          } else {
            this.router.navigate(["/terms-of-service"]);
          }
        }
      });
  }

  redirecionarParaHome(client: AuthenticatedClientResponseDto): void {
    this.loading = false;

    if (client.role === Role.ADMIN || client.role === Role.DEVELOPER) {
      this.router.navigate(["/admin"]);
    } else {
      if (client.hasSubscription && !client.hasAdRequest) {
        this.router.navigate(["/client/my-telas"]);
      } else {
        this.router.navigate(["/client"]);
      }
    }
  }

  private toClient(dto: AuthenticatedClientResponseDto): Client {
    const role = Object.values(Role).includes(dto.role as Role)
      ? (dto.role as Role)
      : undefined;

    const status = Object.values(DefaultStatus).includes(dto.status as DefaultStatus)
      ? (dto.status as DefaultStatus)
      : undefined;

    return {
      id: dto.id,
      businessName: dto.businessName,
      role,
      industry: dto.industry,
      status,
      termAccepted: dto.termAccepted,
      permissions: dto.permissions,
      contact: dto.contact,
      addresses: dto.addresses?.map((a) => ({
        id: a.id,
        street: a.street,
        zipCode: a.zipCode,
        city: a.city,
        state: a.state,
        country: a.country,
        address2: a.address2 ?? undefined,
        latitude: a.latitude,
        longitude: a.longitude,
        partnerAddress: a.partnerAddress,
        coordinatesParams: a.coordinatesParams,
      })),
      attachments: dto.attachments?.map((att) => ({
        id: att.attachmentId,
        fileName: att.attachmentName,
        url: att.attachmentLink,
      })),
      currentSubscriptionFlowStep: dto.currentSubscriptionFlowStep,
    };
  }

  logout(): void {
    this.autenticacaoService.logout();
    this.router.navigate(["/login"]);
  }

  habilitarBotao(): boolean {
    return !this.form.valid || this.loading;
  }

  mensagemLoginInvalidoDialog(
    mensagem = "Invalid identification number or password"
  ): void {
    const config = DialogoUtils.criarConfig({
      titulo: "Invalid!",
      descricao: mensagem,
      icon: "report",
      acaoPrimaria: "Back",
      acaoPrimariaCallback: () => {
        this.ref?.close();
      },
    });
    this.ref = this.dialogService.open(DialogoComponent, config);
  }
}
