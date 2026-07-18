import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null;

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear();
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.clear();
        }
        if (typeof alert !== 'undefined') {
          alert('Session expired. Please login again.');
        }
        if (typeof window !== 'undefined') {
          router.navigate(['/']);
        }
      }

      if (error.status === 403) {
        // Access denied or account disabled
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear();
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.clear();
        }
        if (typeof alert !== 'undefined') {
          alert(error.error?.message || 'Access denied. You have been logged out.');
        }
        if (typeof window !== 'undefined') {
          router.navigate(['/']);
        }
      }

      return throwError(() => error);
    })
  );
};
