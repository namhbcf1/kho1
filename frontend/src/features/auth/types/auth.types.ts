export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  phone?: string;
  position?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginFormProps {
  onSubmit?: (values: LoginCredentials) => void;
  loading?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface UserProfileProps {
  user?: User;
  onUpdate?: (data: any) => void;
  loading?: boolean;
}

export interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  fallback?: React.ReactNode;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
}
