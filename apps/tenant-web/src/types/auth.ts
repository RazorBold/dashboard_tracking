export type UserRole = 'super_admin' | 'admin' | 'operator' | 'viewer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
  avatar: string | null;
}

export interface AuthResponse {
  success: boolean;
  data: {
    accessToken: string;
    user: AuthUser;
  };
}
