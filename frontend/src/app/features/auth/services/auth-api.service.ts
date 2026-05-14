import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, of, tap, throwError } from 'rxjs';

import { API_BASE_URL, MOCK_AUTH_USER, USE_MOCK_AUTH } from '../../../core/config/api.config';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly authSession = inject(AuthSessionService);
  private readonly apiUrl = `${API_BASE_URL}/user`;
  private readonly mockToken = 'mock-jwt-token';

  login(payload: LoginRequest): Observable<LoginResponse> {
    // Mock authentication logic
    if (USE_MOCK_AUTH) {
      if (
        payload.username !== MOCK_AUTH_USER.username ||
        payload.password !== MOCK_AUTH_USER.password
      ) {
        return throwError(() => new Error('Invalid mock credentials'));
      }

      return of({
        token: this.mockToken,
        expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
        session_id: 'mock-session-id'
      }).pipe(
        delay(300),
        tap((response) => this.authSession.setToken(response.token))
      );
    }
    // ------  Delete Mock until here ------


    
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, payload)
      .pipe(tap((response) => this.authSession.setToken(response.token)));
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    // Mock authentication logic
    if (USE_MOCK_AUTH) {
      return of({
        userId: 'mock-user-id',
        username: payload.username,
        created_at: new Date().toISOString(),
        token: this.mockToken
      }).pipe(
        delay(300),
        tap((response) => this.authSession.setToken(response.token))
      );
    }
    // ------  Delete Mock until here ------

    return this.http
      .post<RegisterResponse>(`${this.apiUrl}/register`, payload)
      .pipe(tap((response) => this.authSession.setToken(response.token)));
  }

  logout(): Observable<void> {
    // Mock authentication logic
    if (USE_MOCK_AUTH) {
      return of(void 0).pipe(
        delay(150),
        tap(() => this.authSession.clearToken())
      );
    }
    // ------  Delete Mock until here ------


    return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.authSession.clearToken())
    );
  }
}
