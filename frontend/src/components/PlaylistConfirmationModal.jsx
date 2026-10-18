import { useEffect, useRef } from "react";

export default function PlaylistConfirmationModal({ title, children, confirmLabel, pendingLabel, pending, error, onClose, onConfirm }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="delete-playlist-title"
      aria-describedby="delete-playlist-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
      className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-6 text-white shadow-2xl backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <h2 id="delete-playlist-title" className="mb-4 text-2xl font-bold">
        {title}
      </h2>
      <p id="delete-playlist-description" className="mb-6 text-sm leading-relaxed text-gray-300">
        {children}
      </p>
      {error && (
        <p role="alert" className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          autoFocus
          onClick={onClose}
          disabled={pending}
          className="cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:bg-gray-800 hover:text-white focus-visible:outline-2 focus-visible:outline-fuchsia-400 disabled:cursor-wait disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className="cursor-pointer rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-red-400 disabled:cursor-wait disabled:opacity-50"
        >
          {pending ? pendingLabel : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
