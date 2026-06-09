import { CommonModule } from "@angular/common";
import { Component, HostListener, OnInit, SecurityContext } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { LayoutUtils } from "@app/shared/utils/layout.utils";
import { ButtonModule } from "primeng/button";
import { DynamicDialogConfig, DynamicDialogRef } from "primeng/dynamicdialog";
import { IconCheckComponent } from "../../icons/check.icon";
import { IconWarningComponent } from "../../icons/warning.icon";
import { ConfirmationDialogData } from "../../services/confirmation-dialog.service";

@Component({
  selector: "app-confirmation-dialog",
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    IconWarningComponent,
    IconCheckComponent,
  ],
  template: `
    <div class="confirmation-dialog">
      <div class="message" [class]="data.severity || 'info'">
        <div class="icon-container">
          <app-icon-warning
            *ngIf="data.severity === 'warn' || data.severity === 'error'"
            class="error"
            [size]="35"
          ></app-icon-warning>
          <app-icon-check
            *ngIf="data.severity === 'success'"
            class="success"
            [size]="35"
          ></app-icon-check>
          <app-icon-warning
            *ngIf="!data.severity || data.severity === 'info'"
            class="info"
            [size]="35"
          ></app-icon-warning>
        </div>
        <!-- <span class="message-text">{{ data.message}}</span> -->

        <div
          id="test-descricao-dialog"
          class="message-text message-text-container"
          [innerHTML]="safeMessage"
        ></div>
      </div>

      <div class="actions">
        <button
          pButton
          icon="pi pi-times"
          severity="secondary"
          id="btnSecundario"
          (click)="onCancel()"
          [outlined]="true"
          style="flex: 1;"
        >
          {{ data.cancelLabel || "Cancel" }}
        </button>

        <button
          pButton
          icon="pi pi-check"
          [severity]="getButtonSeverity()"
          [ngClass]="{ btnDanger: data.severity === 'error' }"
          id="btnPrimario"
          (click)="onConfirm()"
          style="flex: 1;"
        >
          {{ data.confirmLabel || "Confirm" }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      ::ng-deep {
        .p-dialog-content {
          padding: 1rem 1rem 2rem 1rem !important;
        }

        .p-button.p-button-info {
          color: var(--cor-branca) !important;
        }
      }

      .message {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;
        text-align: center;
      }

      .message-text-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }

      .icon-container {
        display: flex;
        justify-content: center;
      }

      .icon-container svg {
        width: 2rem;
        height: 2rem;
      }

      .message-text {
        font-size: 1rem;
        line-height: 1.5;
        color: var(--cor-primaria);
      }

      .actions {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 2rem;
      }

      .btnDanger {
        background-color: var(--cor-erro);
        color: var(--cor-branca);

        &:hover {
          background-color: var(--cor-erro) !important;
          color: var(--cor-branca);
          opacity: 0.8;
        }
      }
    `,
  ],
})
export class ConfirmationDialogComponent implements OnInit {
  data: ConfirmationDialogData;
  safeMessage: SafeHtml = "";

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private readonly sanitizer: DomSanitizer
  ) {
    this.data = config.data;
    // data?.message pode conter dados informados por usuários (nome de anúncio,
    // razão social, etc.) interpolados em HTML — sanitizamos antes de usar
    // [innerHTML] para remover scripts/handlers de evento mantendo a formatação.
    const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, this.data?.message ?? "");
    this.safeMessage = this.sanitizer.bypassSecurityTrustHtml(sanitized ?? "");
  }

  @HostListener("window:resize", ["$event"])
  onResize() {
    this.config.width = LayoutUtils.getWidth();
  }

  ngOnInit(): void {
    this.onResize();
  }

  getButtonSeverity(): "info" | "success" | "warn" | "danger" {
    switch (this.data.severity) {
      case "success":
        return "success";
      case "warn":
        return "warn";
      case "error":
        return "danger";
      default:
        return "info";
    }
  }

  onConfirm(): void {
    this.ref.close(true);
  }

  onCancel(): void {
    this.ref.close(false);
  }
}
