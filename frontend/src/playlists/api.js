export async function playlistApi(path = "", options = {}) {
  const response = await fetch(`/api/v1/playlists${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      ...options.headers,
    },
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || "Não foi possível processar a operação na playlist.");
    error.code = data?.code || "UNKNOWN_ERROR";
    error.status = response.status;
    throw error;
  }
  return data;
}