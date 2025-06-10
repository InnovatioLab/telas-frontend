import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Authentication } from '../auth/autenthication';
import { Role } from '@app/model/client';
import { ToastService } from '../state/toast.service';

export const AdminAuthenticatedGuard: CanActivateFn = (route, state) => {
  console.log('AdminAuthenticatedGuard: Ativado, verificando permissões');
  console.log('Rota atual:', state.url);
  
  const router = inject(Router);
  const authentication = inject(Authentication);
  const toastService = inject(ToastService);
  
  console.log('AdminAuthenticatedGuard: Verificando token');
  if (!authentication.isTokenValido()) {
    console.log('AdminAuthenticatedGuard: Token inválido, redirecionando para login');
    router.navigate(['/login']);
    return false;
  }
  
  const client = authentication._clientSignal();
  console.log('AdminAuthenticatedGuard: Client:', client);
  
  const userRole = client?.role;
  console.log('AdminAuthenticatedGuard: Papel do usuário:', userRole);
  
  if (userRole !== Role.ADMIN) {
    console.log('AdminAuthenticatedGuard: Usuário não é admin, redirecionando');
    toastService.erro('You do not have permission to access this page');
    router.navigate(['/client']);
    return false;
  }
  
  console.log('AdminAuthenticatedGuard: Acesso permitido');
  return true;
};

