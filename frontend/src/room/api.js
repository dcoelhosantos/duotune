export async function roomApi(path = "", options = {}) {
  let response;
  try {
    response = await fetch(`/api/v1/rooms/current${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        ...options.headers,
      },
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Não foi possível acessar a sala. Verifique sua conexão e tente novamente.", { cause: error });
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(response.status === 401
      ? "Sua sessão expirou. Entre novamente para acessar a sala."
      : data?.message || "Não foi possível acessar a sala. Tente novamente.");
    error.status = response.status;
    throw error;
  }
  return data;
}