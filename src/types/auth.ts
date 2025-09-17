export type UserRole = "admin" | "customer";

export interface User {
  role: UserRole;
  name: string;
  email: string;
}

export interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void;
  logout: () => void;
  isAuthenticated: boolean;
}