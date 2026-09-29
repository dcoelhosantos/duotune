export async function spotifyApi(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api/spotify/${path}`, {
      ...options,
      credentials: "same-origin",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        ...options.headers,
      },
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "Não foi possível conectar ao servidor do DuoTune. Verifique se o frontend e o backend estão rodando e tente novamente.",
      { cause: error },
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      response.status === 401
        ? "Sua sessão expirou. Entre novamente no DuoTune."
        : data.message ||
            "Não foi possível acessar a integração com o Spotify. Tente novamente.",
    );
    error.status = response.status;
    throw error;
  }

  return data;
}

let sdkPromise;

export function loadSpotifySdk() {
  if (window.Spotify) return Promise.resolve(window.Spotify);

  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const timer = setTimeout(() => fail(), 20000);

      function fail() {
        clearTimeout(timer);
        script.remove();
        sdkPromise = undefined;
        reject(
          new Error(
            "Não foi possível carregar o player do Spotify. Recarregue a página.",
          ),
        );
      }

      window.onSpotifyWebPlaybackSDKReady = () => {
        clearTimeout(timer);
        resolve(window.Spotify);
      };

      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      script.onerror = fail;
      document.head.appendChild(script);
    });
  }

  return sdkPromise;
}
