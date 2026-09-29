import { useCallback, useEffect, useRef, useState } from "react";
import { useSpotify } from "../spotify/SpotifyContext";
import { roomApi } from "./api";

export function useRoomPlayback(room) {
  const { info, snapshot, status, joined, updateSnapshot, clientId } = room;
  const {
    deviceId,
    audioBlocked,
    enableRoomAudio,
    syncRoomAudio,
    pauseRoomAudio,
    setRoomMode,
  } = useSpotify();
  const [enabled, setEnabled] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const [playbackBusy, setPlaybackBusy] = useState(false);
  const [position, setPosition] = useState(0);
  const latest = useRef(null);
  const commandPending = useRef(false);
  const engine = useRef(Promise.resolve());
  const ready = !!snapshot?.readyUsers?.some(
    (user) => user.userId === info?.currentUserId && user.clientId === clientId,
  );
  const bothReady =
    status === "connected" && snapshot?.readyUsers?.length === 2;
  const track = snapshot?.queue?.[0]?.track;
  const present = !!snapshot?.onlineUserIds?.includes(info?.currentUserId);

  useEffect(() => {
    latest.current = {
      snapshot,
      clockOffset: snapshot ? snapshot.serverTime - Date.now() : 0,
    };
  }, [snapshot]);

  useEffect(() => {
    setRoomMode(joined);
    return () => setRoomMode(false);
  }, [joined, setRoomMode]);

  useEffect(() => {
    if (
      status !== "connected" ||
      !present ||
      !enabled ||
      !deviceId ||
      audioBlocked
    )
      return;
    let active = true;
    let pending = false;
    async function register() {
      if (pending) return;
      pending = true;
      try {
        const state = await roomApi("/ready", {
          method: "POST",
          body: JSON.stringify({ clientId, ready: true }),
        });
        if (active) updateSnapshot(state);
        else
          await roomApi("/ready", {
            method: "POST",
            body: JSON.stringify({ clientId, ready: false }),
          });
      } catch (error) {
        if (active) {
          setEnabled(false);
          setPlaybackError(error.message);
        }
      } finally {
        pending = false;
      }
    }
    void register();
    const timer = setInterval(register, 10000);
    return () => {
      active = false;
      clearInterval(timer);
      void roomApi("/ready", {
        method: "POST",
        body: JSON.stringify({ clientId, ready: false }),
      }).catch(() => {});
    };
  }, [
    status,
    present,
    enabled,
    deviceId,
    audioBlocked,
    clientId,
    updateSnapshot,
  ]);

  useEffect(() => {
    if (
      status !== "connected" ||
      !enabled ||
      !deviceId ||
      audioBlocked ||
      !ready
    ) {
      if (joined || enabled)
        engine.current = engine.current
          .catch(() => {})
          .then(pauseRoomAudio)
          .catch(() => {});
      return;
    }
    let active = true;
    let pending = false;
    let firstSync = true;
    async function synchronize() {
      if (pending) return;
      pending = true;
      engine.current = engine.current
        .catch(() => {})
        .then(async () => {
          if (!active) return;
          const value = latest.current;
          if (!value?.snapshot?.playback) return;
          await syncRoomAudio(
            value.snapshot.queue[0]?.track,
            value.snapshot.playback,
            value.clockOffset,
            firstSync,
          );
          firstSync = false;
        });
      try {
        await engine.current;
      } catch (error) {
        if (active) {
          setPlaybackError(error.message);
          setEnabled(false);
        }
      } finally {
        pending = false;
      }
    }
    void synchronize();
    const timer = setInterval(synchronize, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [
    status,
    enabled,
    deviceId,
    audioBlocked,
    ready,
    joined,
    snapshot?.playback?.revision,
    syncRoomAudio,
    pauseRoomAudio,
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      const value = latest.current;
      const playback = value?.snapshot?.playback;
      const current = value?.snapshot?.queue[0]?.track;
      setPosition(
        !current || !playback
          ? 0
          : Math.min(
              current.durationMs,
              playback.positionMs +
                (playback.playing
                  ? Math.max(
                      0,
                      Date.now() + value.clockOffset - playback.updatedAt,
                    )
                  : 0),
            ),
      );
    }, 250);
    return () => clearInterval(timer);
  }, []);

  async function enableAudio() {
    setPlaybackError("");
    try {
      await enableRoomAudio();
      setEnabled(true);
    } catch (error) {
      setPlaybackError(error.message);
    }
  }

  const mutate = useCallback(
    async (path, options) => {
      if (commandPending.current) return;
      commandPending.current = true;
      setPlaybackBusy(true);
      setPlaybackError("");
      try {
        updateSnapshot(await roomApi(path, options));
      } catch (error) {
        setPlaybackError(error.message);
        if (error.status === 409) {
          try {
            const current = await roomApi();
            updateSnapshot(current.state);
          } catch {
            /* Keep the original error. */
          }
        }
      } finally {
        commandPending.current = false;
        setPlaybackBusy(false);
      }
    },
    [updateSnapshot],
  );

  function control(action, positionMs) {
    return mutate("/playback", {
      method: "POST",
      body: JSON.stringify({
        action,
        positionMs,
        revision: snapshot?.playback?.revision,
      }),
    });
  }

  function join() {
    setPlaybackError("");
    setEnabled(true);
    // Aproveita o gesto de entrada para liberar áudio sem exigir outro clique.
    if (deviceId) {
      void enableRoomAudio().catch((error) => {
        setEnabled(false);
        setPlaybackError(error.message);
      });
    }
    room.join();
  }

  function leave() {
    setEnabled(false);
    engine.current = engine.current
      .catch(() => {})
      .then(pauseRoomAudio)
      .catch(() => {});
    room.leave();
  }

  return {
    join,
    needsAudioAction: audioBlocked || (!enabled && !!playbackError),
    leave,
    track,
    position,
    bothReady,
    audioReady: ready && enabled && !!deviceId && !audioBlocked,
    enableAudio,
    playbackError,
    playbackBusy,
    control,
    addTrack: (trackId) =>
      mutate("/queue", { method: "POST", body: JSON.stringify({ trackId }) }),
    removeTrack: (entryId) => mutate(`/queue/${entryId}`, { method: "DELETE" }),
  };
}
