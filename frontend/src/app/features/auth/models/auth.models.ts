export interface LoginResponse {
  token: string;
  expires_at: string;
  session_id: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
}

export interface RegisterResponse {
  userId: string;
  username: string;
  created_at: string;
  token: string;
}
