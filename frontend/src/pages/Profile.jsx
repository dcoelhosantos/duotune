import { useEffect, useRef, useState } from "react";
import { FaSpotify } from "react-icons/fa";
import { FiCamera, FiCheck, FiMusic, FiUser } from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import { profileApi } from "../profile/api";
import { spotifyApi } from "../spotify/api";
import { useSpotify } from "../spotify/SpotifyContext";

export default function Profile() {
  const { connected, loading } = useSpotify();
  const [params] = useSearchParams();
  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}"),
  );
  const [name, setName] = useState(user.name || "");
  const [busy, setBusy] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [failedImageUrl, setFailedImageUrl] = useState(null);
  const fileRef = useRef(null);
  const messages = {
    connected: "Conta Spotify conectada!",
    disconnected: "Conta Spotify desconectada do DuoTune.",
    denied: "Você cancelou a conexão com o Spotify.",
    invalid_state: "A autorização expirou. Tente conectar novamente.",
    error: "Não foi possível concluir a conexão com o Spotify.",
  };

  useEffect(() => {
    let active = true;
    profileApi()
      .then((data) => {
        if (active) {
          setUser(data);
          setName(data.name);
          setReady(true);
        }
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  async function update(path, options, message) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = await profileApi(path, options);
      setUser(data);
      if (!path) setName(data.name);
      setNotice(message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (
      !["image/jpeg", "image/png"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setError("Escolha uma foto JPG ou PNG de até 2 MB.");
      return;
    }
    const body = new FormData();
    body.append("file", file);
    void update("/photo", { method: "POST", body }, "Foto atualizada!");
  }

  async function connect() {
    setConnecting(true);
    setError("");
    try {
      const { url } = await spotifyApi("authorize");
      window.location.assign(url);
    } catch (err) {
      setError(err.message);
      setConnecting(false);
    }
  }

  async function disconnect() {
    setDisconnecting(true);
    setError("");
    try {
      await spotifyApi("disconnect", { method: "DELETE" });
      // Recria a página para encerrar o SDK e descartar eventos pendentes do player.
      window.location.replace("/perfil?spotify=disconnected");
    } catch (err) {
      setError(err.message);
      setDisconnecting(false);
    }
  }

  const disabled = busy || !ready;
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-fuchsia-400 mb-2">
          Sua conta
        </p>
        <h1 className="text-3xl font-bold">Do seu jeito.</h1>
        <p className="text-gray-400 mt-2">
          Seu perfil, suas músicas e as conexões que importam.
        </p>
      </div>
      <section className="rounded-2xl overflow-hidden border border-gray-800 bg-gray-950">
        <div className="h-28 bg-linear-to-r from-fuchsia-900 via-purple-900 to-gray-900" />
        <div className="px-6 pb-6 sm:px-8">
          <div className="flex flex-wrap items-end gap-5 -mt-12">
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-full border-4 border-gray-950 bg-fuchsia-950 flex items-center justify-center overflow-hidden">
                {user.profileImageUrl &&
                user.profileImageUrl !== failedImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="Sua foto de perfil"
                    onError={() => setFailedImageUrl(user.profileImageUrl)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiUser size={40} className="text-fuchsia-300" />
                )}
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => fileRef.current.click()}
                aria-label="Alterar foto de perfil"
                className="absolute bottom-0 right-0 rounded-full bg-fuchsia-600 p-2.5 border-4 border-gray-950 hover:bg-fuchsia-500 disabled:opacity-50"
              >
                <FiCamera size={16} />
              </button>
            </div>
            <div className="pb-1 min-w-0">
              <h2 className="text-2xl font-bold wrap-break-words">
                {user.name || "Meu perfil"}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {user.createdAt
                  ? `No DuoTune desde ${new Date(user.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`
                  : "Música é melhor em dupla."}
              </p>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={upload}
            disabled={disabled}
          />
          <div className="flex flex-wrap items-center gap-4 mt-5 text-sm">
            <button
              type="button"
              disabled={disabled}
              onClick={() => fileRef.current.click()}
              className="font-medium text-fuchsia-400 hover:text-fuchsia-300 disabled:opacity-50"
            >
              {busy ? "Salvando..." : "Escolher foto"}
            </button>
            {user.profileImageUrl && (
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  update("/photo", { method: "DELETE" }, "Foto removida.")
                }
                className="text-gray-400 hover:text-white disabled:opacity-50"
              >
                Remover foto
              </button>
            )}
            <span className="text-gray-500">
              JPG ou PNG · até 2 MB · recorte central
            </span>
          </div>
        </div>
      </section>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-green-300"
        >
          <FiCheck />
          {notice}
        </p>
      )}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-gray-800 bg-gray-950 p-6 sm:p-8">
          <h2 className="text-lg font-semibold flex items-center gap-3">
            <FiUser className="text-fuchsia-400" /> Informações pessoais
          </h2>
          <p className="text-sm text-gray-400 mt-2 mb-6">
            Como você aparece no DuoTune.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void update(
                "",
                {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name }),
                },
                "Perfil atualizado!",
              );
            }}
            className="space-y-5"
          >
            <div>
              <label htmlFor="profile-name" className="block text-sm mb-2">
                Nome de exibição
              </label>
              <input
                id="profile-name"
                required
                maxLength={100}
                disabled={disabled}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 outline-none focus:border-fuchsia-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="profile-email" className="block text-sm mb-2">
                E-mail da conta
              </label>
              <input
                id="profile-email"
                readOnly
                value={user.email || ""}
                className="w-full rounded-xl border border-gray-800 bg-gray-900/50 px-4 py-3 text-gray-400"
              />
              <p className="text-xs text-gray-500 mt-2">
                Usado para entrar na sua conta. Não é alterado por aqui.
              </p>
            </div>
            <button
              disabled={disabled || !name.trim() || name.trim() === user.name}
              className="rounded-xl bg-fuchsia-600 px-5 py-3 font-semibold hover:bg-fuchsia-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {busy ? "Salvando..." : "Salvar alterações"}
            </button>
          </form>
        </section>
        <section className="rounded-2xl border border-gray-800 bg-gray-950 p-6 sm:p-8 flex flex-col items-start">
          <div className="flex items-center gap-3 w-full">
            <FaSpotify size={30} className="text-green-400" />
            <h2 className="text-lg font-semibold">Spotify</h2>
            <span
              className={`ml-auto text-xs rounded-full px-3 py-1 ${connected ? "bg-green-500/10 text-green-400" : "bg-gray-800 text-gray-400"}`}
            >
              {loading
                ? "Verificando"
                : connected
                  ? "Conectado"
                  : "Não conectado"}
            </span>
          </div>
          <h3 className="text-xl font-semibold mt-7">
            Sua trilha sonora, aqui.
          </h3>
          <p className="text-sm leading-relaxed text-gray-400 mt-3">
            Conecte sua conta para ouvir músicas completas e controlar a
            reprodução sem sair do DuoTune.
          </p>
          <p className="flex items-center gap-2 text-sm text-gray-300 mt-5">
            <FiMusic className="text-green-400" /> Reprodução disponível com
            Spotify Premium.
          </p>
          {messages[params.get("spotify")] && (
            <p role="status" className="text-sm mt-4">
              {messages[params.get("spotify")]}
            </p>
          )}
          <button
            onClick={connect}
            disabled={connecting || disconnecting || loading}
            className="mt-7 rounded-xl border border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/20 px-5 py-3 font-semibold disabled:opacity-50"
          >
            {connecting
              ? "Redirecionando..."
              : connected
                ? "Reconectar com Spotify"
                : "Conectar com Spotify"}
          </button>
          {connected && (
            <button
              type="button"
              onClick={disconnect}
              disabled={connecting || disconnecting || loading}
              className="mt-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 px-5 py-3 font-semibold disabled:opacity-50"
            >
              {disconnecting ? "Desconectando..." : "Desconectar do Spotify"}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
