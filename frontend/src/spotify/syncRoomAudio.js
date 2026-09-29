import { spotifyApi } from "./api.js";

export async function applyRoomPlayback(
  player,
  deviceId,
  track,
  playback,
  clockOffset,
  forceSeek = false,
) {
  const current = await player.getCurrentState();
  if (!track || !playback.playing) {
    if (current && !current.paused) await player.pause();
    if (
      track &&
      current?.track_window.current_track.id === track.id &&
      Math.abs(current.position - playback.positionMs) > (forceSeek ? 0 : 750)
    )
      await player.seek(playback.positionMs);
    return;
  }
  const target = Math.max(
    0,
    Math.min(
      track.durationMs - 1,
      playback.positionMs +
        Math.max(0, Date.now() + clockOffset - playback.updatedAt),
    ),
  );
  if (current?.track_window.current_track.id !== track.id) {
    let response;
    for (let attempt = 0; attempt < 2; attempt++) {
      const token = await spotifyApi(
        attempt ? "refresh" : "token",
        attempt ? { method: "POST" } : {},
      );
      // O dispositivo é obtido do SDK desta conta, nunca do parceiro.
      const device = deviceId;
      if (!device) throw new Error("O dispositivo Spotify ficou indisponível.");
      response = await fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(device)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [`spotify:track:${track.id}`],
            position_ms: target,
          }),
        },
      );
      if (response.status !== 401) break;
    }
    if (!response.ok)
      throw new Error(
        response.status === 403
          ? "A reprodução exige Spotify Premium e acesso autorizado."
          : "Não foi possível tocar a música no Spotify. Habilite o áudio para tentar novamente.",
      );
  } else {
    if (Math.abs(current.position - target) > (forceSeek ? 0 : 1500))
      await player.seek(target);
    if (current.paused) await player.resume();
  }
}
