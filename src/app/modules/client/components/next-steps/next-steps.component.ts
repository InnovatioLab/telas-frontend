import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-next-steps",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./next-steps.component.html",
  styleUrls: ["./next-steps.component.scss"],
})
export class NextStepsComponent {}

