// src/ProtectedRoute.tsx
// Skydda routes med MSAL (inte ditt gamla AuthContext).
// OBS: Inga route-deklarationer här.

import { Navigate, useLocation } from "react-router-dom";
import { useIsAuthenticated } from "@azure/msal-react";

type Props = { children: React.ReactNode };

export default function ProtectedRoute({ children }: Props) {
  const isAuthenticated = useIsAuthenticated();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
