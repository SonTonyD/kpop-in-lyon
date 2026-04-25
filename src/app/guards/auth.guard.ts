import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const session = auth.session() ?? (await auth.loadSession());

  if (session) {
    return true;
  }

  return router.createUrlTree(['/back-office/login']);
};
