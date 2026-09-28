package br.com.duotune.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final StompAccessInterceptor access;
    private final String frontendUrl;

    public WebSocketConfig(StompAccessInterceptor access, @Value("${frontend.url}") String frontendUrl) {
        this.access = access;
        this.frontendUrl = frontendUrl;
    }

    @Bean
    public ThreadPoolTaskScheduler stompHeartbeatScheduler() {
        var scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("stomp-heartbeat-");
        scheduler.setRemoveOnCancelPolicy(true);
        return scheduler;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.setErrorHandler(new StompErrorHandler());
        registry.addEndpoint("/ws").setAllowedOrigins(frontendUrl);
        registry.addEndpoint("/ws-sockjs").setAllowedOrigins(frontendUrl)
                .withSockJS().setSessionCookieNeeded(false);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/topic/duos/")
                .setTaskScheduler(stompHeartbeatScheduler())
                .setHeartbeatValue(new long[] {10000, 10000});
        registry.setPreservePublishOrder(true);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(access);
    }

    @Override
    public void configureClientOutboundChannel(ChannelRegistration registration) {
        registration.interceptors(access.outbound());
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        registration.setMessageSizeLimit(16 * 1024)
                .setSendBufferSizeLimit(128 * 1024)
                .setSendTimeLimit(15000)
                .setTimeToFirstMessage(15000);
    }
}