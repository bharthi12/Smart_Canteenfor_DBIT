package com.canteen.dto.order;

import com.canteen.entity.OrderItem;
import java.math.BigDecimal;

public record OrderItemResponse(
    Long id,
    Long dishId,
    String dishName,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal subtotal
) {
    public static OrderItemResponse fromEntity(OrderItem item) {
        return new OrderItemResponse(
            item.getId(),
            item.getDish() != null ? item.getDish().getId() : null,
            item.getDishName(),
            item.getQuantity(),
            item.getUnitPrice(),
            item.getSubtotal()
        );
    }
}
