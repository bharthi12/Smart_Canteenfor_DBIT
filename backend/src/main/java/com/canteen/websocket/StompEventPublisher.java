package com.canteen.websocket;

import com.canteen.entity.Dish;
import com.canteen.entity.FoodOrder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class StompEventPublisher implements EventPublisher {

    private static final Logger log = LoggerFactory.getLogger(StompEventPublisher.class);

    private final SimpMessagingTemplate messagingTemplate;

    public StompEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @Override
    public void publishOrderCreated(FoodOrder order) {
        OrderEvent event = new OrderEvent(
            "ORDER_CREATED",
            order.getId(),
            order.getTokenNumber(),
            order.getStatus(),
            order.getPaymentStatus(),
            Instant.now().toString()
        );
        log.info("Publishing ORDER_CREATED event for token {}", order.getTokenNumber());
        messagingTemplate.convertAndSend("/topic/staff/orders", event);
        messagingTemplate.convertAndSend("/topic/orders/" + order.getId(), event);
    }

    @Override
    public void publishOrderStatusUpdated(FoodOrder order) {
        OrderEvent event = new OrderEvent(
            "ORDER_STATUS_UPDATED",
            order.getId(),
            order.getTokenNumber(),
            order.getStatus(),
            order.getPaymentStatus(),
            Instant.now().toString()
        );
        log.info("Publishing ORDER_STATUS_UPDATED event for order {} (status: {}, payment: {})",
            order.getId(), order.getStatus(), order.getPaymentStatus());
        messagingTemplate.convertAndSend("/topic/orders/" + order.getId(), event);
        messagingTemplate.convertAndSend("/topic/staff/orders", event);
    }

    @Override
    public void publishDishAvailabilityUpdated(Dish dish) {
        DishEvent event = new DishEvent(
            "DISH_AVAILABILITY_UPDATED",
            dish.getId(),
            dish.getName(),
            dish.isAvailable(),
            Instant.now().toString()
        );
        log.info("Publishing DISH_AVAILABILITY_UPDATED event for dish {} (available: {})",
            dish.getName(), dish.isAvailable());
        messagingTemplate.convertAndSend("/topic/dishes", event);
    }
}
