export async function memoriesApi(path = "", options = {}) {
  const isForm = options.body instanceof FormData;
  let response;
  try {
    response = await fetch(`/api/v1/memories${path}`, {
      ...options,
      headers: {
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        ...options.headers,
      },
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error("Não foi possível conectar ao servidor. Tente novamente.", {
      cause: error,
    });
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(
      response.status === 401
        ? "Sua sessão expirou. Entre novamente para continuar."
        : data?.message || "Não foi possível acessar o álbum de memórias.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
