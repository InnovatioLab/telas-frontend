import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";
import { IconsModule } from "@app/shared/icons/icons.module";

@Component({
  selector: "app-rodape",
  standalone: true,
  imports: [CommonModule, RouterModule, IconsModule],
  templateUrl: "./rodape.component.html",
  styleUrls: ["./rodape.component.scss"],
})
export class RodapeComponent {}
