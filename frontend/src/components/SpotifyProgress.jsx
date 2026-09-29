import { useState } from "react";

function formatTime(milliseconds) {
  const seconds = Math.floor(Math.max(0, milliseconds) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function SpotifyProgress({
  position,
  duration,
  disabled,
  onSeek,
}) {
  const [draft, setDraft] = useState(null);
  const value = Math.min(draft ?? position, duration);

  function commit() {
    if (draft === null || disabled) return;
    void onSeek(draft);
    setDraft(null);
  }

  return (
    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 tabular-nums">
      <span className="w-12 text-right">{formatTime(value)}</span>
      <input
        type="range"
        min={0}
        max={duration || 1}
        step={1000}
        value={value}
        disabled={disabled || duration <= 0}
        aria-label="Posição da música"
        aria-valuetext={`${formatTime(value)} de ${formatTime(duration)}`}
        className="w-full h-5 cursor-pointer accent-fuchsia-500 touch-none disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-fuchsia-400"
        onChange={(event) => setDraft(Number(event.target.value))}
        onPointerDown={(event) =>
          event.currentTarget.setPointerCapture(event.pointerId)
        }
        onPointerUp={commit}
        onKeyUp={commit}
        onPointerCancel={() => setDraft(null)}
        onBlur={commit}
      />
      <span className="w-12">{formatTime(duration)}</span>
    </div>
  );
}
