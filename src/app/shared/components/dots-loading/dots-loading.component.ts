import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LoadingService } from '@app/core/service/loading.service';
import { delay } from 'rxjs';

@Component({
  selector: 'app-dots-loading',
  standalone: true,
  imports: [CommonModule, 
    // PrimengModule
  ],
  templateUrl: './dots-loading.component.html',
  styleUrls: ['./dots-loading.component.scss']
})
export class DotsLoadingComponent implements OnInit {
  loading = false;

  constructor(private _loading: LoadingService) {}

  ngOnInit(): void {
    this.listenToLoading();
  }

  listenToLoading(): void {
    this._loading.loadingSub.pipe(delay(0)).subscribe((loading: boolean) => {
      this.loading = loading;
    });
  }
}
