import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthenticationService } from "@app/core/service/api/authentication.service";
import { ClientService } from "@app/core/service/api/client.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { AuthenticationStorage } from "@app/core/service/auth/authentication-storage";
import {
  Client,
  DefaultStatus,
  Role,
  isPartnerRole,
  isPrivilegedPanelRole,
} from "@app/model/client";
import { ILoginRequest } from "@app/model/dto/request/login.request";
import { AuthenticatedClientResponseDto } from "@app/model/dto/response/authenticated-client-response.dto";
import { CardCenteredComponent, ErrorComponent } from "@app/shared";
import { BaseModule } from "@app/shared/base/base.module";
import { DialogComponent } from "@app/shared/components/dialog/dialog.component";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { DialogUtils } from "@app/shared/utils/dialog-config.utils";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { HttpErrorResponse } from "@angular/common/http";
import {
  isLoginFlowError,
  resolveLoginFlowError,
} from "@app/core/error/login-error.util";
import { catchError, finalize, throwError } from "rxjs";

type LoginMode = "client" | "partner";

@Component({
  selector: "app-login",
  imports: [
    CommonModule,
    BaseModule,
    PrimengModule,
    CardCenteredComponent,
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
  loginMode!: LoginMode;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    public dialogService: DialogService,
    private readonly autenticacaoService: AuthenticationService,
    private readonly clientService: ClientService,
    private readonly authentication: Authentication
  ) {
    this.iniciarFormulario();
  }

  ngOnInit(): void {
    const modeParam = this.route.snapshot.queryParamMap.get("mode");
    if (modeParam !== "partner" && modeParam !== "client") {
      void this.router.navigate(["/"]);
      return;
    }

    this.loginMode = modeParam;
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
      login: ["", [Validators.required, Validators.email]],
      password: [
        "",
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(32),
        ],
      ],
    });
  }

  goBack(): void {
    this.router.navigate(["/"]);
  }

  get isPartnerMode(): boolean {
    return this.loginMode === "partner";
  }

  get pageTitle(): string {
    return this.isPartnerMode ? "Telas Partner" : "Telas";
  }

  get pageSubtitle(): string {
    return this.isPartnerMode
      ? "Partner access area"
      : "Sign in to your account";
  }

  login(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const { login, password } = this.form.value;

    const payload: ILoginRequest = {
      username: login,
      password: password,
    };

    this.autenticacaoService
      .login(payload)
      .pipe(
        catchError((error: unknown) => {
          const loginError = isLoginFlowError(error)
            ? error
            : error instanceof HttpErrorResponse
              ? resolveLoginFlowError(error, "credentials")
              : resolveLoginFlowError(error, "credentials");
          this.mensagemLoginInvalidoDialog(loginError.message);
          return throwError(() => loginError);
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (response) => {
          if (!response?.client) {
            return;
          }

          const r = response as {
            token?: string;
            accessToken?: string;
            refreshToken?: string;
            client: AuthenticatedClientResponseDto;
          };

          if (!this.isRoleAllowedForLoginMode(r.client.role)) {
            this.mensagemLoginInvalidoDialog(this.getLoginRoleMismatchMessage());
            return;
          }

          const accessToken = r.accessToken ?? r.token;
          if (accessToken) {
            AuthenticationStorage.setToken(accessToken);
          }
          if (r.refreshToken) {
            AuthenticationStorage.setRefreshToken(r.refreshToken);
          }

          const client = this.toClient(r.client);
          this.clientService.setCurrentClient(client);
          this.authentication.updateClientData(client);

          if (r.client.termAccepted) {
            this.redirecionarParaHome(r.client);
          } else {
            this.router.navigate(["/terms-of-service"]);
          }
        },
        error: () => {},
      });
  }

  private isRoleAllowedForLoginMode(
    role: Role | string | undefined
  ): boolean {
    const normalizedRole = String(role ?? "")
      .trim()
      .toUpperCase();

    if (isPrivilegedPanelRole(normalizedRole)) {
      return true;
    }

    if (this.loginMode === "partner") {
      return normalizedRole === Role.PARTNER;
    }

    if (normalizedRole === Role.PARTNER) {
      return false;
    }

    return normalizedRole === Role.CLIENT;
  }

  private getLoginRoleMismatchMessage(): string {
    if (this.loginMode === "partner") {
      return "This account is not a partner. Please sign in using Login Client.";
    }
    return "This account is a partner. Please sign in using Login Partner.";
  }

  redirecionarParaHome(client: AuthenticatedClientResponseDto): void {
    this.loading = false;

    if (client.role === Role.ADMIN || client.role === Role.DEVELOPER) {
      this.router.navigate(["/admin"]);
    } else if (isPartnerRole(client.role)) {
      this.router.navigate(["/partner/screens"]);
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
      partnerSlotsAnyLocationEnabled: dto.partnerSlotsAnyLocationEnabled,
      adminCanCreatePartnerEnabled: dto.adminCanCreatePartnerEnabled,
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
    this.router.navigate(["/"]);
  }

  habilitarBotao(): boolean {
    return !this.form.valid || this.loading;
  }

  mensagemLoginInvalidoDialog(
    message = "Invalid identification number or password"
  ): void {
    const config = DialogUtils.createConfig({
      title: "Invalid!",
      description: message,
      icon: "report",
      primaryAction: "Back",
      primaryActionCallback: () => {
        this.ref?.close();
      },
    });
    this.ref = this.dialogService.open(DialogComponent, config);
  }
}
