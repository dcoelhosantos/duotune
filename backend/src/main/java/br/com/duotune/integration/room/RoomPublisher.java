package br.com.duotune.integration.room;

import br.com.duotune.dto.RoomDtos.State;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class RoomPublisher {
    private final SimpMessagingTemplate messaging;

    public RoomPublisher(SimpMessagingTemplate messaging) { this.messaging = messaging; }

    public void publish(Long duoId, State state) {
        messaging.convertAndSend(destination(duoId), state);
    }

    public boolean isRoomDestination(Long duoId, String destination) {
        return destination(duoId).equals(destination);
    }

    private String destination(Long duoId) { return "/topic/duos/" + duoId + "/room"; }
}
