import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: 'app-guest-lading',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
  ],
  templateUrl: './guest-lading.component.html',
  styleUrls: ['./guest-lading.component.scss']
})
export class GuestLadingComponent implements OnInit {

  constructor() {
    console.log('GuestLadingComponent constructor');
  }

  ngOnInit(): void {
    console.log('GuestLadingComponent inicializado');
  }
}
