package br.com.duotune.port.music;

public interface TrackCatalog {
    record Track(String id, String title, String artist, String imageUrl, long durationMs) {}

    void requirePremium(String email);

    Track track(String email, String id);
}
