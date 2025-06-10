import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Authentication } from '../auth/autenthication';
import { Role } from '@app/model/client';
import { ToastService } from '../state/toast.service';

export const ClientAuthenticatedGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authentication = inject(Authentication);
  const toastService = inject(ToastService);
  
  if (!authentication.isTokenValido()) {
    router.navigate(['/login']);
    return false;
  }
  
  const userRole = authentication._clientSignal()?.role;
  
  // Permite acesso tanto para CLIENT quanto para ADMIN
  if (userRole !== Role.CLIENT && userRole !== Role.ADMIN) {
    toastService.erro('You do not have permission to access this page');
    router.navigate(['/']);
    return false;
  }
  
  return true;
};
