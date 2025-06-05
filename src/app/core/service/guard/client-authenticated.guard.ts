import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Authentication } from '../auth/autenthication';

export const AutenticacaoLoginGuard: CanActivateFn = () => {
  const router = inject(Router);
  const authentication = inject(Authentication);

  if (authentication.isTokenValido()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
