import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import {
  LoginEntryMode,
  LoginTypePickerModalComponent,
} from "@app/modules/manage-access/login/login-type-picker-modal.component";
import { DialogService } from "primeng/dynamicdialog";

@Injectable({
  providedIn: "root",
})
export class LoginEntryService {
  constructor(
    private readonly dialogService: DialogService,
    private readonly router: Router
  ) {}

  openLoginTypePicker(): void {
    const ref = this.dialogService.open(LoginTypePickerModalComponent, {
      header: "Sign in",
      width: "420px",
      modal: true,
      closable: true,
      closeOnEscape: true,
      dismissableMask: true,
      styleClass: "login-type-picker-dialog",
      contentStyle: {
        overflow: "visible",
        padding: "1rem 1.25rem 1.25rem",
      },
    });

    ref.onClose.subscribe((mode: LoginEntryMode | undefined) => {
      if (mode === "client" || mode === "partner") {
        this.router.navigate(["/auth/login"], {
          queryParams: { mode },
        });
      }
    });
  }
}
