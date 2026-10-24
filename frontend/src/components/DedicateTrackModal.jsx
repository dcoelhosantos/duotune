import { useState } from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiMusic,
  FiX,
  FiGift,
} from "react-icons/fi";
import { duoApi } from "../duo/api";

const dateToValue = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

function DedicationDatePicker({ value, minDate, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    if (value) {
      const [year, month] = value.split("-").map(Number);
      return new Date(year, month - 1, 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstWeekday + 1;
    const date = new Date(year, month, day);
    return { date, value: dateToValue(date), isCurrentMonth: day > 0 && day <= daysInMonth };
  });
  const firstAllowedMonth = (() => {
    const [minYear, minMonth] = minDate.split("-").map(Number);
    return new Date(minYear, minMonth - 1, 1);
  })();
  const previousMonth = new Date(year, month - 1, 1);
  const canGoToPreviousMonth = previousMonth >= firstAllowedMonth;

  const formattedValue = value
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
        new Date(`${value}T12:00:00`),
      )
    : "Escolher data de envio";

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={`flex w-full items-center justify-between gap-3 rounded-xl border bg-gray-950 px-4 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40 ${
          isOpen ? "border-fuchsia-500" : "border-gray-700 hover:border-gray-600"
        }`}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/10 text-fuchsia-400">
            <FiCalendar size={18} />
          </span>
          <span className={value ? "font-medium text-white" : "text-gray-400"}>
            {formattedValue}
          </span>
        </span>
        <FiChevronRight
          className={`shrink-0 text-gray-500 transition-transform ${isOpen ? "rotate-90" : ""}`}
          size={18}
        />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Selecionar data de envio"
          className="mt-2 rounded-2xl border border-gray-700 bg-gray-900 p-4 shadow-2xl shadow-black/50"
        >
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              aria-label="Mês anterior"
              disabled={!canGoToPreviousMonth}
              onClick={() => setDisplayedMonth(previousMonth)}
              className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <FiChevronLeft size={18} />
            </button>
            <p className="font-semibold capitalize text-white">
              {new Intl.DateTimeFormat("pt-BR", {
                month: "long",
                year: "numeric",
              }).format(displayedMonth)}
            </p>
            <button
              type="button"
              aria-label="Próximo mês"
              onClick={() => setDisplayedMonth(new Date(year, month + 1, 1))}
              className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
            >
              <FiChevronRight size={18} />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold uppercase text-gray-500">
            {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
              <span key={day} className="py-2">{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ date, value: dayValue, isCurrentMonth }) => {
              const isDisabled = !isCurrentMonth || dayValue < minDate;
              const isSelected = dayValue === value;
              const isToday = dayValue === minDate;
              const isAvailable = isCurrentMonth && dayValue >= minDate;

              return (
                <button
                  key={dayValue}
                  type="button"
                  disabled={isDisabled}
                  aria-pressed={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  aria-label={new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "full",
                  }).format(date)}
                  onClick={() => {
                    onChange(dayValue);
                    setIsOpen(false);
                  }}
                  className={`aspect-square rounded-lg text-sm transition-colors disabled:cursor-default ${
                    isSelected
                      ? "bg-fuchsia-600 font-bold text-white"
                      : isAvailable
                        ? "text-gray-200 hover:bg-gray-800"
                        : "text-gray-700"
                  } ${isToday && !isSelected ? "ring-1 ring-fuchsia-500/60" : ""}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
          <p className="mt-3 border-t border-gray-800 pt-3 text-xs text-gray-500">
            Você pode escolher amanhã ou qualquer data futura.
          </p>
        </div>
      )}
    </div>
  );
}

export default function DedicateTrackModal({ track, onClose }) {
  const [scheduledDate, setScheduledDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  // A surpresa pode ser programada a partir de amanhã.
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const offsetMs = tomorrow.getTimezoneOffset() * 60000;
  const minDate = new Date(tomorrow.getTime() - offsetMs)
    .toISOString()
    .split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await duoApi("/dedications", {
        method: "POST",
        body: JSON.stringify({
          trackSpotifyId: track.id,
          title: track.title,
          artist: track.artist,
          imageUrl: track.imageUrl,
          scheduledDate: scheduledDate,
          message: message,
        }),
      });
      setSuccess(true);
    } catch (err) {
      if (err.status === 409) {
        setError("Você já programou uma surpresa para este dia.");
      } else {
        setError(err.message || "Erro ao programar a música.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dedicate-track-title"
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white cursor-pointer transition-colors"
        >
          <FiX size={24} />
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-fuchsia-500/20 text-fuchsia-400">
              <FiGift size={32} />
            </div>
            <h2 id="dedicate-track-title" className="mb-2 text-2xl font-bold text-white">
              Surpresa Programada!
            </h2>
            <p className="text-gray-400 mb-8 text-sm px-4">
              A música será entregue no primeiro acesso da sua dupla no dia
              escolhido.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-fuchsia-600 py-3 font-bold text-white hover:bg-fuchsia-500 transition-colors cursor-pointer"
            >
              Concluir
            </button>
          </div>
        ) : (
          <>
            <h2
              id="dedicate-track-title"
              className="mb-6 text-xl font-bold text-white flex items-center gap-2"
            >
              <FiCalendar className="text-fuchsia-500" /> Programar Surpresa
            </h2>

            <div className="mb-6 flex items-center gap-4 rounded-xl bg-gray-800/50 p-4">
              {track.imageUrl ? (
                <img
                  src={track.imageUrl}
                  alt={track.title}
                  className="h-16 w-16 rounded object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-800">
                  <FiMusic className="text-gray-500 text-2xl" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-bold text-white">{track.title}</p>
                <p className="truncate text-sm text-gray-400">{track.artist}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Data de entrega
                </label>
                <DedicationDatePicker
                  value={scheduledDate}
                  minDate={minDate}
                  onChange={setScheduledDate}
                />
                <p className="mt-2 text-xs text-gray-500">
                  A música será entregue no primeiro acesso da sua dupla neste
                  dia.
                </p>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">
                  Recado (Opcional)
                </label>
                <textarea
                  maxLength={255}
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escreva algo especial..."
                  className="w-full rounded bg-gray-800 border border-gray-700 p-2 text-white focus:outline-none focus:border-fuchsia-500 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !scheduledDate}
                className="w-full rounded-lg bg-fuchsia-600 py-3 font-bold text-white hover:bg-fuchsia-500 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loading ? "Programando..." : "Programar Envio"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
