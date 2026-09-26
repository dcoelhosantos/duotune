import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSession } from "../auth/useSession";

export const PrivateRoute = () => {
  const [hadSession] = useState(() =>
    Boolean(localStorage.getItem("accessToken")),
  );
  const isAuthenticated = useSession();

  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate
      to="/entrar"
      replace
      state={{ sessionExpired: hadSession }}
    />
  );
};
