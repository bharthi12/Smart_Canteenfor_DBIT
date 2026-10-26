package com.canteen.dto.order;

import com.canteen.enums.PaymentStatus;
import jakarta.validation.constraints.NotNull;

public record UpdatePaymentStatusRequest(
    @NotNull(message = "Payment status is required")
    PaymentStatus paymentStatus
) {}
