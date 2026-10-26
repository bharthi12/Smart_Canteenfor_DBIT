package com.canteen.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${app.frontend-origin:http://localhost:5173}")
    private String frontendOrigin;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // In-memory message broker with /topic prefix
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns(frontendOrigin, "http://localhost:*", "http://127.0.0.1:*")
            .withSockJS();

        // Also register pure WebSocket endpoint without SockJS
        registry.addEndpoint("/ws")
            .setAllowedOriginPatterns(frontendOrigin, "http://localhost:*", "http://127.0.0.1:*");
    }
}
