import { Component } from "@angular/core";
import { IconsModule } from "@app/shared/icons/icons.module";

@Component({
  selector: "app-guest-footer",
  templateUrl: "./guest-footer.component.html",
  styleUrls: ["./guest-footer.component.scss"],
  standalone: true,
  imports: [IconsModule],
})
export class GuestFooterComponent {}
