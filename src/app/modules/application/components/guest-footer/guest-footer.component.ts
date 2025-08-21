import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { IconsModule } from "@app/shared/icons/icons.module";

@Component({
  selector: "app-guest-footer",
  templateUrl: "./guest-footer.component.html",
  styleUrls: ["./guest-footer.component.scss"],
  standalone: true,
  imports: [RouterModule, IconsModule, CommonModule],
})
export class GuestFooterComponent {}
