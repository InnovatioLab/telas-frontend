import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AutenticacaoService } from "@app/core/service/api/autenticacao.service";
import { ClientService } from "@app/core/service/api/client.service";
import { Authentication } from "@app/core/service/auth/autenthication";
import { Client, Role } from "@app/model/client";
import { ILoginRequest } from "@app/model/dto/request/login.request";
import { CardCentralizadoComponent, ErrorComponent } from "@app/shared";
import { BaseModule } from "@app/shared/base/base.module";
import { DialogoComponent } from "@app/shared/components/dialogo/dialogo.component";
import { IconsModule } from "@app/shared/icons/icons.module";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { DialogoUtils } from "@app/shared/utils/dialogo-config.utils";
import { DialogService, DynamicDialogRef } from "primeng/dynamicdialog";
import { catchError, finalize, firstValueFrom, of } from "rxjs";
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
  }

  onlyNumbersInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, "");
    this.form.get("login").setValue(input.value);
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
        if (response) {
          this.authentication.isLoggedIn$.next(true);
          this.verificarTermo();
        }
      });
  }

  async verificarTermo(): Promise<void> {
    this.loading = true;
    try {
      const authenticatedClient = await firstValueFrom(
        this.clientService.getAuthenticatedClient()
      );

      this.authentication.updateClientData(authenticatedClient as any);

      if (authenticatedClient.termAccepted) {
        this.redirecionarParaHome(authenticatedClient as any);
      } else {
        this.router.navigate(["/terms-of-service"]);
      }
    } catch (error) {
      console.error("Error checking acceptance of terms:", error);
      this.mensagemLoginInvalidoDialog(
        "Error checking your data. Please try again."
      );
      this.logout();
    } finally {
      this.loading = false;
    }
  }

  redirecionarParaHome(client?: Client): void {
    if (!client) {
      client = this.autenticacaoService.user;

      if (!client) {
        this.router.navigate(["/client"]);
        return;
      }
    }

    this.loading = false;

    if (client.role === Role.ADMIN) {
      this.router.navigate(["/admin"]);
    } else {
      this.router.navigate(["/client"]);
    }
  }

  logout(): void {
    this.autenticacaoService.logout();
    this.router.navigate(["/login"]);
  }

  validarNumeroIdentificacao(numero: string): boolean {
    return /^\d{1,9}$/.test(numero);
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
