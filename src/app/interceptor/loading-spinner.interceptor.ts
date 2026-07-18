import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingSpinnerService } from '../services/loading-spinner.service';

export const loadingSpinnerInterceptor: HttpInterceptorFn = (req, next) => {
  const loader = inject(LoadingSpinnerService);

  loader.show();

  return next(req).pipe(
    finalize(() => loader.hide())
  );
};
