import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthSessionService } from '../services/auth-session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authSession = inject(AuthSessionService);
  const router = inject(Router);
  const token = authSession.getToken();
  const authRequest = token
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : request;

  return next(authRequest).pipe(
    catchError((error) => {
      if (error.status === 401) {
        authSession.clearToken();
        void router.navigateByUrl('/login');
      }

      return throwError(() => error);
    })
  );
};
