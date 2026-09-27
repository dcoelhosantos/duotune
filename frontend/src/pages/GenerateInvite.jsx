import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { invitationApi } from "../duo/api";
import { profileApi } from "../profile/api";

const defaultAvatar = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

export default function GenerateInvite() {
  const [targetEmail, setTargetEmail] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [viewState, setViewState] = useState("form");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [storedUser, setStoredUser] = useState(() => JSON.parse(localStorage.getItem("user") || "{}"));
  const currentUser = { name: storedUser.name || "Você", avatar: storedUser.profileImageUrl || defaultAvatar };
  const [partnerUser, setPartnerUser] = useState({ name: "Aguardando...", avatar: defaultAvatar });
  const copyTimeoutRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    Promise.all([profileApi(), invitationApi("/pending")]).then(([user, pending]) => {
      if (!active) return;
      setStoredUser(user);
      if (pending && !user.duoId) {
        setTargetEmail(pending.recipient.email);
        setGeneratedCode(pending.invitation.code);
        setPartnerUser({ name: pending.recipient.name, avatar: pending.recipient.profileImageUrl || defaultAvatar });
        setViewState("waiting");
      }
    }).catch((err) => {
      if (active) setError(err.message);
    }).finally(() => {
      if (active) setIsChecking(false);
    });
    return () => { active = false; clearTimeout(copyTimeoutRef.current); };
  }, []);

  useEffect(() => {
    if (viewState !== "waiting" || !generatedCode) return;
    let active = true;
    let timer;
    const poll = async () => {
      try {
        const data = await invitationApi(`/${generatedCode}/status`);
        if (!active) return;
        setError("");
        if (data.status === "ACCEPTED") {
          await profileApi();
          if (!active) return;
          setViewState("paired");
          return;
        }
        if (data.status === "EXPIRED" || data.status === "CANCELLED") {
          setError(data.status === "EXPIRED"
            ? "Este convite expirou após 24 horas. Você pode enviar um novo convite."
            : "Este convite foi cancelado. Você pode enviar um novo convite.");
          setTargetEmail("");
          setGeneratedCode("");
          setViewState("form");
          return;
        }
      } catch (err) {
        if (!active) return;
        setError(err.message);
        if (err.status === 404) {
          setGeneratedCode("");
          setViewState("form");
          return;
        }
      }
      if (active) timer = setTimeout(poll, 3000);
    };
    timer = setTimeout(poll, 3000);
    return () => { active = false; clearTimeout(timer); };
  }, [viewState, generatedCode, navigate]);

  useEffect(() => {
    if (viewState !== "paired") return;
    const timer = setTimeout(() => navigate("/"), 3500);
    return () => clearTimeout(timer);
  }, [viewState, navigate]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (isLoading || isChecking) return;
    setError("");
    const cleanEmail = targetEmail.trim().toLowerCase();
    if (storedUser.duoId) {
      setError("Você já possui um Duo e não pode enviar novos convites.");
      return;
    }
    if (cleanEmail === storedUser.email?.trim().toLowerCase()) {
      setError("Você não pode enviar um convite para seu próprio e-mail.");
      return;
    }
    setIsLoading(true);
    try {
      const data = await invitationApi("", { method: "POST", body: JSON.stringify({ email: cleanEmail }) });
      setTargetEmail(cleanEmail);
      setGeneratedCode(data.invitation.code);
      setViewState("waiting");
      setPartnerUser({ name: data.recipient.name, avatar: data.recipient.profileImageUrl || defaultAvatar });
    } catch (err) {
      setError(err.message);
      if (err.code === "INVITATION_ALREADY_EXISTS") {
        try {
          const pending = await invitationApi("/pending");
          if (pending) {
            setTargetEmail(pending.recipient.email);
            setGeneratedCode(pending.invitation.code);
            setPartnerUser({ name: pending.recipient.name, avatar: pending.recipient.profileImageUrl || defaultAvatar });
            setViewState("waiting");
          }
        } catch { /* Manter o erro original visível */ }
      }
    } finally { setIsLoading(false); }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setIsCopied(true);
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setIsCopied(false), 2000);
    } catch { setError("Não foi possível copiar. Selecione e copie o código manualmente."); }
  };

  const confirmCancel = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    try {
      await invitationApi(`/${generatedCode}`, { method: "DELETE" });
      setViewState("form");
      setTargetEmail("");
      setGeneratedCode("");
    } catch (err) { setError(err.message); }
    finally { setShowCancelModal(false); setIsLoading(false); }
  };

  return (
    <div className="space-y-8">
      <header>
        <div className="flex flex-col">
          <div className="flex items-center gap-4 mb-1">
            <Link
              to="/"
              aria-label="Voltar para o início"
              className="text-fuchsia-500 hover:text-fuchsia-400 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-wide">
              Pareamento
            </h1>
          </div>
          <p className="text-gray-300 text-base ml-10">
            Encontre alguém especial para compartilhar sua trilha sonora.
          </p>
        </div>
      </header>

      {(error || (storedUser.duoId && viewState !== "paired")) && (
        <p role="alert" className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl text-sm">
          {error || "Você já possui um Duo e não pode enviar novos convites."}
        </p>
      )}
      {isChecking && <p role="status" className="text-gray-400">Verificando seus convites...</p>}
      <section className="flex flex-col items-center py-8">
        {viewState === "form" && (
          <div className="w-full max-w-md text-center animate-fade-in">
            <h3 className="text-2xl font-semibold mb-6">Enviar convite</h3>
            <form onSubmit={handleGenerate} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="E-mail do seu parceiro(a)"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                required
                className="w-full p-4 bg-gray-950 rounded-xl border border-gray-800 focus:border-fuchsia-500 outline-none transition-colors text-base"
              />
              <button
                type="submit"
                disabled={isLoading || isChecking || !!storedUser.duoId}
                className="w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-500 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-base"
              >
                {isLoading ? "Gerando..." : "Gerar Link de Convite"}
              </button>
            </form>
          </div>
        )}

        {(viewState === "waiting" || viewState === "paired") && (
          <div className="w-full max-w-2xl text-center animate-fade-in flex flex-col items-center">
            <div className="flex items-center justify-center gap-4 lg:gap-8 mb-8">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 lg:w-36 lg:h-36 rounded-full border-4 border-fuchsia-500 overflow-hidden bg-gray-800 shadow-[0_0_20px_rgba(217,70,239,0.3)]">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="mt-4 text-base md:text-lg font-medium text-gray-200">
                  {currentUser.name}
                </span>
              </div>

              <div
                className={`text-5xl lg:text-7xl -mt-10 ${viewState === "waiting" ? "text-fuchsia-500 animate-pulse" : "text-fuchsia-500"}`}
              >
                ♥
              </div>

              <div className="flex flex-col items-center">
                <div
                  className={`w-24 h-24 lg:w-36 lg:h-36 rounded-full border-4 overflow-hidden bg-gray-800 flex items-center justify-center transition-colors duration-500 ${viewState === "waiting" ? "border-purple-700" : "border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.3)]"}`}
                >
                  {viewState === "waiting" ? (
                    <span className="text-4xl text-gray-500">?</span>
                  ) : (
                    <img
                      src={partnerUser.avatar}
                      alt={partnerUser.name}
                      className="w-full h-full object-cover animate-fade-in"
                    />
                  )}
                </div>
                <span className="mt-4 text-base md:text-lg font-medium text-gray-200">
                  {viewState === "waiting" ? "Aguardando..." : partnerUser.name}
                </span>
              </div>
            </div>

            {viewState === "waiting" ? (
              <>
                <h3 className="text-3xl font-semibold mb-2">
                  Convite enviado!
                </h3>
                <p className="text-gray-300 text-base mb-6">
                  Aguardando a outra pessoa aceitar o convite
                  <br />
                  para formarmos a dupla.
                </p>

                <div className="bg-gray-950 border border-gray-800 rounded-xl px-6 py-4 mb-8 max-w-md w-full flex items-center gap-5 text-left">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-8 h-8 text-purple-500 shrink-0"
                  >
                    <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                    <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
                  </svg>
                  <p className="text-gray-300 text-sm md:text-base">
                    Compartilhe este código com a pessoa da conta{" "}
                    <strong className="text-white">{targetEmail}</strong>.
                  </p>
                </div>

                <div className="w-full max-w-lg mb-2">
                  <div className="bg-gray-950 p-2 rounded-xl flex items-center justify-between border border-gray-800">
                    <div className="pl-4 py-2 text-left">
                      <span className="text-sm text-purple-400 block mb-1 font-semibold">
                        Código do convite
                      </span>
                      <span className="text-lg text-white font-mono">
                        {generatedCode}
                      </span>
                    </div>
                    <button
                      onClick={copyCode}
                      className={`px-8 py-3 rounded-lg font-medium h-full transition-colors cursor-pointer text-base ${isCopied ? "bg-green-600 text-white" : "bg-purple-700 hover:bg-purple-600 text-white"}`}
                    >
                      {isCopied ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                  <div className="h-6 mt-3">
                    {isCopied && (
                      <p className="text-green-400 text-base font-medium animate-fade-in">
                        ✓ Código copiado com sucesso!
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-base text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                >
                  Cancelar convite
                </button>
              </>
            ) : (
              <div className="animate-fade-in">
                <h3 className="text-3xl font-semibold mb-2 text-fuchsia-400">
                  Dupla Formada!
                </h3>
                <p className="text-gray-300 text-base mb-10">
                  Você e {partnerUser.name} agora estão conectados no DuoTune.
                </p>
                <div className="w-10 h-10 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto opacity-50"></div>
              </div>
            )}
          </div>
        )}
      </section>

      {showCancelModal && (
        <div
          onClick={() => setShowCancelModal(false)}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in px-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-950 p-8 rounded-2xl border border-gray-800 max-w-sm w-full text-center shadow-2xl"
          >
            <h4 className="text-xl font-bold text-white mb-3">
              Cancelar convite?
            </h4>
            <p className="text-gray-400 text-base mb-8">
              O código gerado será invalidado e você precisará criar um novo
              para formar um duo.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 rounded-xl font-medium bg-gray-800 hover:bg-gray-700 text-white transition-colors cursor-pointer text-base"
              >
                Voltar
              </button>
              <button
                onClick={confirmCancel}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl font-medium bg-red-600/90 hover:bg-red-500 text-white transition-colors cursor-pointer shadow-[0_0_15px_-3px_rgba(220,38,38,0.4)] text-base"
              >
                Sim, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
