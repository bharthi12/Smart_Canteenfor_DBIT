package com.canteen.dto.order;

import com.canteen.entity.FoodOrder;
import com.canteen.enums.OrderStatus;
import com.canteen.enums.PaymentMethod;
import com.canteen.enums.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
    Long id,
    String tokenNumber,
    Long userId,
    String userName,
    String userEmail,
    BigDecimal totalAmount,
    OrderStatus status,
    PaymentMethod paymentMethod,
    PaymentStatus paymentStatus,
    List<OrderItemResponse> items,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static OrderResponse fromEntity(FoodOrder order) {
        List<OrderItemResponse> itemResponses = order.getItems() != null
            ? order.getItems().stream().map(OrderItemResponse::fromEntity).toList()
            : List.of();

        return new OrderResponse(
            order.getId(),
            order.getTokenNumber(),
            order.getUser().getId(),
            order.getUser().getName(),
            order.getUser().getEmail(),
            order.getTotalAmount(),
            order.getStatus(),
            order.getPaymentMethod(),
            order.getPaymentStatus(),
            itemResponses,
            order.getCreatedAt(),
            order.getUpdatedAt()
        );
    }
}
