import { useEffect, useState } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { profileApi } from "../profile/api";

export function InviteRoute() {
  const { pathname } = useLocation();
  const [verification, setVerification] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    // checa o servidor antes de montar a página.
    profileApi()
      .then((user) => {
        if (active) setVerification({ pathname, attempt, hasDuo: !!user.duoId });
      })
      .catch(() => {
        if (active) setVerification({ pathname, attempt, error: true });
      });

    return () => { active = false; };
  }, [pathname, attempt]);

  if (verification?.pathname !== pathname || verification.attempt !== attempt) {
    return <p role="status" className="text-gray-400">Verificando seu Duo...</p>;
  }

  if (verification.error) {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-red-400">
          Não foi possível verificar seu Duo. Tente novamente para acessar os convites.
        </p>
        <button
          type="button"
          onClick={() => setAttempt((value) => value + 1)}
          className="text-fuchsia-400 hover:text-fuchsia-300 cursor-pointer"
        >
          Tentar novamente
        </button>
        <Link to="/" className="block text-gray-300 hover:text-white">Voltar para a home</Link>
      </div>
    );
  }

  return verification.hasDuo ? <Navigate to="/" replace /> : <Outlet />;
}
