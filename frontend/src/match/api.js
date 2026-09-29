export async function matchApi(options = {}) {
  let response;
  try {
    response = await fetch("/api/v1/duos/match", {
      ...options,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Não foi possível conectar ao servidor. Tente novamente.", {
      cause: error,
    });
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      response.status === 401
        ? "Sua sessão expirou. Entre novamente para continuar."
        : data?.message || "Não foi possível consultar o match musical.",
    );
    error.code = data?.code;
    throw error;
  }
  if (!data)
    throw new Error(
      "O servidor retornou uma resposta inválida. Tente novamente.",
    );
  return data;
}
