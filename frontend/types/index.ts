export interface User {
  id: string;
  email: string;
  name: string;
  role: 'MANAGER' | 'PLANNER' | 'COORDINATOR' | 'FINANCE';
  companyId: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  companyName: string;
  industry: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
