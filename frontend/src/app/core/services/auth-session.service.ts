import { Injectable } from '@angular/core';

import { USE_MOCK_AUTH } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly tokenStorageKey = 'tourplanner.auth.token';

  setToken(token: string): void {
    localStorage.setItem(this.tokenStorageKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenStorageKey);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();

    if (!token) {
      return false;
    }

    if (!USE_MOCK_AUTH && this.isTokenExpired(token)) {
      this.clearToken();
      return false;
    }

    return true;
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenStorageKey);
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeJwtPayload(token);

    if (!payload?.exp || typeof payload.exp !== 'number') {
      return true;
    }

    return Date.now() >= payload.exp * 1000;
  }

  private decodeJwtPayload(token: string): { exp?: unknown } | null {
    try {
      const payload = token.split('.')[1];

      if (!payload) {
        return null;
      }

      return JSON.parse(atob(this.toBase64(payload))) as { exp?: unknown };
    } catch {
      return null;
    }
  }

  private toBase64(value: string): string {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4;

    if (padding === 0) {
      return normalized;
    }

    return normalized.padEnd(normalized.length + 4 - padding, '=');
  }
}
