package br.com.duotune.integration.room;

import br.com.duotune.service.RoomService;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import org.springframework.web.socket.messaging.SessionUnsubscribeEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
public class RoomWebSocketListener {
    private final RoomService rooms;

    public RoomWebSocketListener(RoomService rooms) { this.rooms = rooms; }

    @EventListener
    public void subscribed(SessionSubscribeEvent event) {
        if (event.getUser() == null) return;
        var headers = StompHeaderAccessor.wrap(event.getMessage());
        rooms.subscribe(event.getUser().getName(), headers.getDestination(), headers.getSessionId(), headers.getSubscriptionId());
    }

    @EventListener
    public void unsubscribed(SessionUnsubscribeEvent event) {
        var headers = StompHeaderAccessor.wrap(event.getMessage());
        rooms.leave(headers.getSessionId(), headers.getSubscriptionId());
    }

    @EventListener
    public void disconnected(SessionDisconnectEvent event) { rooms.leave(event.getSessionId(), null); }
}
