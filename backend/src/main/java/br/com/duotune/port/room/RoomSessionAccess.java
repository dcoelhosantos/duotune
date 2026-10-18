package br.com.duotune.port.room;

/** Consultas de validade das conexões, sem expor o protocolo de transporte à sala. */
public interface RoomSessionAccess {
    boolean isSessionActive(String sessionId);

    boolean isClientActive(Long userId, String clientId);
}
