export async function profileApi(path = "", options = {}) {
  const response = await fetch(`/api/v1/users/me${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(
      data?.message || "Não foi possível atualizar o perfil. Tente novamente.",
    );

  const user = { ...JSON.parse(localStorage.getItem("user") || "{}"), ...data };

  localStorage.setItem("user", JSON.stringify(user));
  window.dispatchEvent(new Event("profile-updated"));

  return user;
}
