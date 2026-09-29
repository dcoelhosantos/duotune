package br.com.duotune.dto;

import java.time.Instant;
import java.util.Map;

public record RecentPlay(String trackId, String trackName, Instant playedAt, Map<String, String> artists) {}
