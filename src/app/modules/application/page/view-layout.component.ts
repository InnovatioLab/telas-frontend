import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '@app/shared/components/header/header.component';

@Component({
  selector: 'app-view-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
  ],
  templateUrl: './view-layout.component.html',
  styleUrls: ['./view-layout.component.scss']
})
export class ViewLayoutComponent  {

  constructor() {}

}
