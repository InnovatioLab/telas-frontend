import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Authentication } from '../auth/autenthication';
import { Role } from '@app/model/client';
import { ToastService } from '../state/toast.service';

export const AdminAuthenticatedGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authentication = inject(Authentication);
  const toastService = inject(ToastService);
  
  if (!authentication.isTokenValido()) {
    router.navigate(['/login']);
    return false;
  }
  
  const client = authentication._clientSignal();
  const userRole = client?.role;
  
  if (userRole !== Role.ADMIN) {
    toastService.erro('You do not have permission to access this page');
    router.navigate(['/client']);
    return false;
  }
  
  return true;
};

