package com.canteen.websocket;

import com.canteen.enums.OrderStatus;
import com.canteen.enums.PaymentStatus;

public record OrderEvent(
    String type,
    Long orderId,
    String tokenNumber,
    OrderStatus status,
    PaymentStatus paymentStatus,
    String updatedAt
) {}
