export async function invitationApi(path = "", options = {}) {
  let response;
  try {
    response = await fetch(`/api/v1/duos/invitations${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(response.status === 401
      ? "Sua sessão expirou. Entre novamente para continuar."
      : data?.message || "Não foi possível processar o convite. Tente novamente.");
    error.code = data?.code;
    error.status = response.status;
    throw error;
  }
  return data;
}
