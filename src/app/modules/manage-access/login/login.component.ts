import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AutenticacaoService } from "@app/core/service/api/autenticacao.service";
import { ClientService } from "@app/core/service/api/client.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { Role } from "@app/model/client";
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
          this.authentication.updateClientData(response.client as any);

          if (response.client.termAccepted) {
            this.redirecionarParaHome(response.client as any);
          } else {
            this.router.navigate(["/terms-of-service"]);
          }
        }
      });
  }

  redirecionarParaHome(client: AuthenticatedClientResponseDto): void {
    this.loading = false;

    if (client.role === Role.ADMIN) {
      this.router.navigate(["/admin"]);
    } else {
      if (client.hasSubscription && !client.hasAdRequest) {
        this.router.navigate(["/client/my-telas"]);
      } else {
        this.router.navigate(["/client"]);
      }
    }
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
