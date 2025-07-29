import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
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
          ></app-icon-warning>
          <app-icon-check *ngIf="data.severity === 'success'"></app-icon-check>
          <app-icon-warning
            *ngIf="!data.severity || data.severity === 'info'"
          ></app-icon-warning>
        </div>
        <span class="message-text">{{ data.message }}</span>
      </div>

      <div class="actions">
        <button
          pButton
          icon="pi pi-times"
          severity="secondary"
          id="btnSecundario"
          (click)="onCancel()"
          [outlined]="true"
        >
          {{ data.cancelLabel || "Cancel" }}
        </button>

        <button
          pButton
          icon="pi pi-check"
          [severity]="getButtonSeverity()"
          (click)="onConfirm()"
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
          padding: 2rem 1rem !important;
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
        margin-bottom: 1.5rem;
        text-align: center;
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
      }

      .message.info {
        color: var(--cor-primaria);
      }

      .message.success {
        color: var(--cor-sucesso);
      }

      .message.warn {
        color: var(--cor-alerta);
      }

      .message.error {
        color: var(--cor-erro);
      }

      .actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 0.5rem;
      }
    `,
  ],
})
export class ConfirmationDialogComponent implements OnInit {
  data: ConfirmationDialogData;

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {
    this.data = config.data;
  }

  ngOnInit(): void {}

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
