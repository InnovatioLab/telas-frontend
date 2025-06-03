import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingService } from '@app/core/service/loading.service';
import { PrimengModule } from '@app/shared/primeng/primeng.module';

@Component({
  selector: 'app-logout',
  standalone: true,
  imports: [
    CommonModule,
    PrimengModule,
  ],
  templateUrl: './logout.component.html',
})
export class LogoutComponent implements OnInit {
  constructor(
    private readonly loadingService: LoadingService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.navegarParaLogin();
  }

  navegarParaLogin(){
    this.loadingService.setLoading(true, 'logout');
    setTimeout(() => {
      this.loadingService.setLoading(false, 'logout');
      this.router.navigate(['/login']);
    }, 500);
  }

}
