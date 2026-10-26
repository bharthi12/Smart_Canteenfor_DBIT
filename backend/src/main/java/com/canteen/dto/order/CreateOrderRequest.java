package com.canteen.dto.order;

import com.canteen.enums.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateOrderRequest(
    @NotNull(message = "Payment method is required")
    PaymentMethod paymentMethod,

    @NotEmpty(message = "Cart cannot be empty. At least one dish must be selected.")
    List<@Valid CreateOrderItemRequest> items
) {}
