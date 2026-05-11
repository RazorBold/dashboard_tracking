export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'operator' | 'viewer';
  avatar?: string | null;
  organizationId?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: User;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthError {
  message: string;
  code?: string;
}
