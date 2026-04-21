export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}
