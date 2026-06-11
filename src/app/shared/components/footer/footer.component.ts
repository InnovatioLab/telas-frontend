import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { RouterModule } from "@angular/router";
import { LayoutService } from "@app/core/service/state/layout.service";
import { IconsModule } from "@app/shared/icons/icons.module";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [CommonModule, RouterModule, IconsModule],
  templateUrl: "./footer.component.html",
  styleUrls: ["./footer.component.scss"],
})
export class FooterComponent {
  private readonly layoutService = inject(LayoutService);

  readonly contentMargin = this.layoutService.contentMargin;
}
