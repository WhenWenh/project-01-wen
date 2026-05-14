import { environment } from '../../../environments/environment';

export const API_BASE_URL = environment.apiBaseUrl;
export const USE_MOCK_AUTH = environment.useMockAuth;

export const MOCK_AUTH_USER = {
  username: 'testuser',
  password: 'test1234',
  email: 'test@tourplanner.local'
} as const