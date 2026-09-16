import { Navigate, Outlet } from "react-router-dom";

export const PublicRoute = () => {
  const isAuthenticated = Boolean(localStorage.getItem("accessToken"));

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
};
