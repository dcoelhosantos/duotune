import { useEffect, useRef, useState } from "react";
import { FaSpotify } from "react-icons/fa";
import {
  FiArrowRight,
  FiHeart,
  FiMusic,
  FiRefreshCw,
  FiUsers,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { matchApi } from "../match/api";

const number = (value) =>
  value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const date = (value) =>
  new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

function SharedItems({ title, items, type, empty }) {
  return (
    <section className="min-w-0 rounded-2xl border border-gray-800 bg-gray-950/60 p-5">
      <h2 className="flex items-center justify-between gap-3 font-semibold">
        {title}
        <span className="rounded-full bg-fuchsia-500/10 px-3 py-1 text-sm text-fuchsia-300">
          {items.length}
        </span>
      </h2>
      {items.length ? (
        <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`https://open.spotify.com/${type}/${encodeURIComponent(item.id)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-xl bg-gray-900 px-4 py-3 text-sm text-gray-200 hover:bg-gray-800 hover:text-fuchsia-200"
              >
                <span className="wrap-break-words">{item.name}</span>
                <FiArrowRight className="shrink-0" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm leading-relaxed text-gray-400">{empty}</p>
      )}
    </section>
  );
}

export default function MusicalMatch() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const request = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    request.current = controller;
    matchApi({ signal: controller.signal })
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => request.current?.abort();
  }, []);

  async function calculate() {
    if (busy) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError(null);
    try {
      setData(await matchApi({ method: "POST", signal: controller.signal }));
    } catch (err) {
      if (err.name !== "AbortError") setError(err);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  const match = data?.latest;
  const unpaired = error?.code === "DUO_REQUIRED";
  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-400">
            Seu espaço a dois
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Match Musical</h1>
          <p className="mt-2 text-sm text-gray-400">
            Descubram o que conecta a trilha sonora de vocês.
          </p>
        </div>
        {!unpaired && (
          <button
            onClick={calculate}
            disabled={loading || busy}
            className="inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-5 py-3 text-sm font-semibold hover:bg-fuchsia-500 disabled:cursor-wait disabled:opacity-50"
          >
            <FiRefreshCw className={busy ? "motion-safe:animate-spin" : ""} />
            {busy
              ? "Comparando históricos..."
              : match
                ? "Atualizar match"
                : "Calcular nosso match"}
          </button>
        )}
      </header>

      {loading && (
        <p role="status" className="py-12 text-center text-gray-400">
          Carregando o match de vocês...
        </p>
      )}
      {error && !unpaired && (
        <div
          role="alert"
          className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200"
        >
          <p>{error.message}</p>
          {match && (
            <p className="mt-2">O resultado abaixo é o último cálculo salvo.</p>
          )}
        </div>
      )}
      {unpaired ? (
        <section className="rounded-3xl border border-gray-800 bg-gray-950 px-6 py-14 text-center">
          <FiUsers size={36} className="mx-auto mb-5 text-fuchsia-400" />
          <h2 className="text-2xl font-bold">Uma descoberta feita para dois</h2>
          <p className="mx-auto mt-3 max-w-md text-gray-400">
            Forme seu Duo para comparar os gostos musicais de vocês.
          </p>
          <Link
            to="/convidar"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-5 py-3 font-semibold hover:bg-fuchsia-500"
          >
            Convidar alguém <FiArrowRight />
          </Link>
          <Link to="/aceitar" className="mt-4 block text-sm text-fuchsia-300">
            Já tenho um convite
          </Link>
        </section>
      ) : (
        !loading && (
          <>
            <section
              aria-live="polite"
              aria-busy={busy}
              className="overflow-hidden rounded-3xl border border-fuchsia-500/20 bg-linear-to-br from-purple-950 via-gray-950 to-gray-950 px-5 py-9 sm:px-8"
            >
              {match ? (
                <>
                  <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-center">
                    <div
                      className="flex h-48 w-48 shrink-0 items-center justify-center rounded-full p-2"
                      style={{
                        background: `conic-gradient(#d946ef ${match.percentage}%, #1f2937 0)`,
                      }}
                    >
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-gray-950">
                        <FiHeart className="mb-2 text-fuchsia-400" size={22} />
                        <span className="text-4xl font-bold">
                          {number(match.percentage)}%
                        </span>
                        <span className="mt-2 text-xs text-gray-400">
                          de match recente
                        </span>
                      </div>
                    </div>
                    <div className="max-w-md text-center sm:text-left">
                      <h2 className="wrap-break-word text-2xl font-semibold">
                        {match.members.map((member) => member.name).join(" + ")}
                      </h2>
                      <p className="mt-3 leading-relaxed text-gray-400">
                        Os artistas aproximam vocês. As músicas em comum dão
                        aquele algo a mais.
                      </p>
                      <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm sm:justify-start">
                        <span className="rounded-xl bg-white/5 px-3 py-2">
                          {number(match.artistPoints)} pontos por artistas
                        </span>
                        <span className="rounded-xl bg-fuchsia-500/10 px-3 py-2 text-fuchsia-200">
                          +{number(match.trackBonus)} por músicas
                        </span>
                      </div>
                      <p className="mt-4 text-xs text-gray-500">
                        Calculado em {date(match.calculatedAt)}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mx-auto max-w-lg py-6 text-center">
                  <FiMusic
                    size={40}
                    className="mx-auto mb-5 text-fuchsia-400"
                  />
                  <h2 className="text-2xl font-semibold">
                    Será que vocês estão no mesmo ritmo?
                  </h2>
                  <p className="mt-4 leading-relaxed text-gray-400">
                    Vamos comparar até 50 reproduções recentes de cada conta
                    Spotify. Os dois precisam conectar suas contas e autorizar o
                    acesso ao histórico.
                  </p>
                  <Link
                    to="/perfil"
                    className="mt-5 inline-flex items-center gap-2 text-sm text-fuchsia-300"
                  >
                    Conectar ou reconectar meu Spotify <FiArrowRight />
                  </Link>
                </div>
              )}
            </section>

            {match && (
              <>
                {match.members.some((member) => member.tracks < 5) && (
                  <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                    Amostra pequena: uma das contas tem menos de 5 músicas
                    distintas. O resultado pode mudar bastante conforme vocês
                    ouvirem mais.
                  </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {match.members.map((member, index) => (
                    <section
                      key={index}
                      className="min-w-0 rounded-2xl border border-gray-800 bg-gray-950/50 p-5"
                    >
                      <h2 className="truncate font-semibold">{member.name}</h2>
                      <p className="mt-2 text-sm text-gray-300">
                        {member.plays} reproduções · {member.tracks} músicas ·{" "}
                        {member.artists} artistas
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-gray-500">
                        De {date(member.oldestPlay)} até{" "}
                        {date(member.newestPlay)}
                      </p>
                    </section>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SharedItems
                    title="Artistas em comum"
                    items={match.sharedArtists}
                    type="artist"
                    empty="Nenhum artista em comum nesta amostra. Novas descobertas podem aproximar os repertórios de vocês."
                  />
                  <SharedItems
                    title="Músicas em comum"
                    items={match.sharedTracks}
                    type="track"
                    empty="Ainda não há faixas iguais nesta amostra. A afinidade entre artistas continua contando para o match."
                  />
                </div>
                <a
                  href="https://open.spotify.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white"
                >
                  <FaSpotify size={18} /> Dados musicais do Spotify
                </a>
              </>
            )}

            <details className="rounded-2xl border border-gray-800 bg-gray-950/50 p-5">
              <summary className="cursor-pointer font-semibold text-gray-200">
                Como funciona o match?
              </summary>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-400">
                <p>
                  Comparamos os artistas e as músicas distintas dos históricos.
                  Repetir uma faixa não aumenta seu peso. Todos os artistas
                  creditados na faixa entram na comparação.
                </p>
                <p>
                  Em cada comparação, a semelhança é duas vezes a quantidade em
                  comum, dividida pela soma das quantidades de cada pessoa.
                </p>
                <p>
                  Os artistas valem até 80 pontos. A semelhança entre músicas
                  preenche o espaço que falta até 100. Por exemplo: mesmos
                  artistas e nenhuma faixa igual dão 80%; mesmos artistas e
                  metade de semelhança entre faixas dão 90%.
                </p>
                <p>
                  É um retrato das reproduções recentes da conta Spotify, que
                  podem cobrir períodos diferentes para cada pessoa. Não mede
                  toda a afinidade de vocês. Versões diferentes da mesma música
                  podem contar separadamente.
                </p>
                <p>
                  O resultado só é atualizado ao clicar em calcular. Cada
                  cálculo guarda sua amostra e pontuação para vocês acompanharem
                  o histórico.
                </p>
              </div>
            </details>

            {!!data?.history?.length && (
              <section className="rounded-2xl border border-gray-800 bg-gray-950/50 p-5">
                <h2 className="font-semibold">Últimos cálculos</h2>
                <ul className="mt-3 divide-y divide-gray-800">
                  {data.history.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-3 py-3 text-sm"
                    >
                      <time
                        dateTime={entry.calculatedAt}
                        className="text-gray-400"
                      >
                        {date(entry.calculatedAt)}
                      </time>
                      <span className="font-semibold text-fuchsia-300">
                        {number(entry.percentage)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )
      )}
    </div>
  );
}
