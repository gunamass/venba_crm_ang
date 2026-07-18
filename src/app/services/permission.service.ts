import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private storageKey = 'allowedRoutes';

  getAllowedRoutes(): string[] {
    try {
      const raw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(this.storageKey) : null;
      if (!raw) return this.getDefaultRoutes();
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : this.getDefaultRoutes();
    } catch {
      return this.getDefaultRoutes();
    }
  }

  private getDefaultRoutes(): string[] {
    // Default route list when user doesn't have explicit permissions yet
    // This allows migration period where DB hasn't been fully populated
    return ['/dashboard', '/lead', '/students', '/staff-task', '/fees', '/staff', '/students-attendance'];
  }

  setAllowedRoutes(routes: string[] | null | undefined) {
    if (typeof sessionStorage === 'undefined') return;
    if (!routes || routes.length === 0) {
      sessionStorage.removeItem(this.storageKey);
      return;
    }
    sessionStorage.setItem(this.storageKey, JSON.stringify(routes));
  }

  hasRoute(route: string): boolean {
    if (!route) return false;
    const role = this.getRoleFromSession();
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') return true;

    const requestedVariants = this.getRouteVariants(route);
    const allowed = this.getAllowedRoutes();
    return allowed.some((item) => this.getRouteVariants(item).some((variant) => requestedVariants.includes(variant)));
  }

  private getRouteVariants(route: string): string[] {
    if (!route) return [];
    const normalized = route.trim().startsWith('/') ? route.trim() : `/${route.trim()}`;
    const variants = new Set<string>([normalized]);

    const withoutAdminPrefix = normalized.replace(/^\/admin/, '');
    if (withoutAdminPrefix !== normalized) {
      variants.add(withoutAdminPrefix);
    }

    if (normalized === '/students' || normalized === '/student') {
      variants.add('/students');
      variants.add('/student');
    }

    if (normalized === '/staff-task' || normalized === '/task') {
      variants.add('/staff-task');
      variants.add('/task');
    }

    if (normalized === '/students-attendance' || normalized === '/student-attendance') {
      variants.add('/students-attendance');
      variants.add('/student-attendance');
    }

    if (normalized === '/user-management' || normalized === '/admin/user-management') {
      variants.add('/user-management');
      variants.add('/admin/user-management');
    }

    return Array.from(variants);
  }

  private getRoleFromSession(): string {
    try {
      const raw = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('role') : null;
      return raw ? JSON.parse(raw).toString().toUpperCase() : '';
    } catch {
      return '';
    }
  }
}
