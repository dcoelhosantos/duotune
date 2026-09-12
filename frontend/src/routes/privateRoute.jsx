import { Navigate, Outlet } from 'react-router-dom';

export const PrivateRoute = () => {
  // Substitua pela lógica real de verificação de token (ex: Context API ou localStorage)
  const isAuthenticated = Boolean(localStorage.getItem('accessToken'));

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};