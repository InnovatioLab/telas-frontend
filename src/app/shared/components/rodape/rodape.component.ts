import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { RouterModule } from "@angular/router";
import { LayoutService } from "@app/core/service/state/layout.service";
import { IconsModule } from "@app/shared/icons/icons.module";

@Component({
  selector: "app-rodape",
  standalone: true,
  imports: [CommonModule, RouterModule, IconsModule],
  templateUrl: "./rodape.component.html",
  styleUrls: ["./rodape.component.scss"],
})
export class RodapeComponent {
  private readonly layoutService = inject(LayoutService);

  readonly contentMargin = this.layoutService.contentMargin;
}
