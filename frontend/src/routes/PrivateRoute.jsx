import { Navigate, Outlet } from "react-router-dom";

export const PrivateRoute = () => {
  const isAuthenticated = Boolean(localStorage.getItem("accessToken"));

  return isAuthenticated ? <Outlet /> : <Navigate to="/entrar" replace />;
};
