import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ClientService } from '@app/core/service/client.service';
import { map, catchError, of } from 'rxjs';
import { AuthenticationStorage } from '../authentication-storage';

@Injectable({
  providedIn: 'root'
})
export class TermosGuard implements CanActivate {
  constructor(
    private readonly clientService: ClientService,
    private readonly router: Router
  ) {}

  canActivate() {
    const userId = AuthenticationStorage.getUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return of(false);
    }

    return this.clientService.buscarClient<any>(userId).pipe(
      map(response => {
        if (response?.termAccepted) {
          return true;
        } else {
          this.router.navigate(['/']);
          return false;
        }
      }),
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
