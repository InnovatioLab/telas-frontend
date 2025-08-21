import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ClientService } from '../api/client.service';
import { AuthenticationStorage } from '../auth/authentication-storage';

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
