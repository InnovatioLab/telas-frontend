import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { PrimengModule } from "@app/shared/primeng/primeng.module";
import { DynamicDialogRef } from "primeng/dynamicdialog";

export type LoginEntryMode = "client" | "partner";

@Component({
  selector: "app-login-type-picker-modal",
  standalone: true,
  imports: [CommonModule, PrimengModule],
  templateUrl: "./login-type-picker-modal.component.html",
  styleUrls: ["./login-type-picker-modal.component.scss"],
})
export class LoginTypePickerModalComponent {
  constructor(private readonly ref: DynamicDialogRef) {}

  select(mode: LoginEntryMode): void {
    this.ref.close(mode);
  }
}
