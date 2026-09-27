import { useSession } from "../auth/useSession";
import { Navigate, Outlet } from "react-router-dom";

export const PublicRoute = () => {
  const isAuthenticated = useSession();

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
};
