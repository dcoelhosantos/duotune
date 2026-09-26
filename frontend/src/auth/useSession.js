import { useEffect, useState } from "react";

export function getSessionExpiration() {
  try {
    const token = localStorage.getItem("accessToken");
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload));
    return Number.isFinite(exp) ? exp * 1000 : 0;
  } catch {
    return 0;
  }
}

export function useSession() {
  const [authenticated, setAuthenticated] = useState(
    () => getSessionExpiration() > Date.now(),
  );

  useEffect(() => {
    let timer;
    function checkSession() {
      clearTimeout(timer);
      const remaining = getSessionExpiration() - Date.now();
      const valid = remaining > 0;
      if (!valid) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
      }
      setAuthenticated(valid);
      if (valid) timer = setTimeout(checkSession, Math.min(remaining, 2147483647));
    }

    // O temporizador cobre a tela aberta; os eventos cobrem abas suspensas e outras abas.
    timer = setTimeout(checkSession, 0);
    window.addEventListener("focus", checkSession);
    window.addEventListener("storage", checkSession);
    document.addEventListener("visibilitychange", checkSession);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", checkSession);
      window.removeEventListener("storage", checkSession);
      document.removeEventListener("visibilitychange", checkSession);
    };
  }, []);

  // A leitura do exp serve à navegação; a validação da assinatura continua no backend.
  return authenticated;
}
