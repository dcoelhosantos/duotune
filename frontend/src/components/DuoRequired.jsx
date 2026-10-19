import { useEffect, useState } from "react";
import DuoEmptyState from "./DuoEmptyState";
import { profileApi } from "../profile/api";

function currentDuoId() {
  try {
    const id = JSON.parse(localStorage.getItem("user") || "{}").duoId;
    return id && id !== "null" ? id : null;
  } catch {
    return null;
  }
}

export default function DuoRequired({ children, heading, icon, title, description }) {
  const [status, setStatus] = useState("loading");
  const [duoId, setDuoId] = useState(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let controller;
    async function refresh() {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      try {
        await profileApi("", { signal: request.signal });
        if (active && !request.signal.aborted) {
          const id = currentDuoId();
          setDuoId(id);
          setStatus(id ? "paired" : "unpaired");
          setError("");
        }
      } catch (err) {
        if (active && !request.signal.aborted) {
          setError(err.message || "Não foi possível verificar seu Duo. Tente novamente.");
          setStatus("error");
        }
      }
    }
    function profileChanged() {
      const id = currentDuoId();
      setDuoId(id);
      setStatus(id ? "paired" : "unpaired");
    }
    function storageChanged(event) {
      if (event.key === "user" || event.key === null) void refresh();
    }
    function visible() {
      if (document.visibilityState === "visible") void refresh();
    }
    void refresh();
    window.addEventListener("profile-updated", profileChanged);
    window.addEventListener("storage", storageChanged);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", visible);
    return () => {
      active = false;
      controller?.abort();
      window.removeEventListener("profile-updated", profileChanged);
      window.removeEventListener("storage", storageChanged);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [attempt]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-5xl space-y-6 pb-10">
        {heading}
        <p role="status" className="py-12 text-center text-sm text-gray-400">
          Verificando seu Duo...
        </p>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="mx-auto max-w-5xl space-y-6 pb-10">
        {heading}
        <section className="rounded-3xl border border-gray-800 bg-gray-950 px-6 py-14 text-center">
          <p role="alert" className="text-gray-300">{error}</p>
          <button
            type="button"
            onClick={() => {
              setStatus("loading");
              setAttempt((value) => value + 1);
            }}
            className="mt-6 cursor-pointer rounded-xl bg-fuchsia-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-fuchsia-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400"
          >
            Tentar novamente
          </button>
        </section>
      </div>
    );
  }
  if (status === "unpaired") {
    return (
      <div className="mx-auto max-w-5xl space-y-6 pb-10">
        {heading}
        <DuoEmptyState icon={icon} title={title} description={description} />
      </div>
    );
  }
  // Um novo pareamento não reutiliza seleções ou dados do parceiro anterior.
  return <div key={duoId}>{children}</div>;
}
