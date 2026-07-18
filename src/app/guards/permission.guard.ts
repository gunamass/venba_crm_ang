import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const permission = inject(PermissionService);
  const router = inject(Router);

  // Derive module path from URL: assume '/admin/X' maps to '/x' as module key
  const url = state.url || '';
  const parts = url.split('/').filter(Boolean);
  // parts[0] might be 'admin'
  let modulePath = '/';
  if (parts.length >= 2 && parts[0].toLowerCase() === 'admin') {
    modulePath = `/${parts[1]}`;
  } else if (parts.length >= 1) {
    modulePath = `/${parts[0]}`;
  }

  // allow admins
  if (auth.isAdmin() || (auth.isSuperAdmin && auth.isSuperAdmin())) {
    return true;
  }

  if (permission.hasRoute(modulePath)) {
    return true;
  }

  // unauthorized: clear session and redirect to login
  auth.logOut();
  // router.navigate(['/']);
  return false;
};
