package com.canteen.dto.dish;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record SaveDishRequest(
    @NotBlank(message = "Dish name is required.")
    @Size(max = 120, message = "Dish name must be 120 characters or fewer.")
    String name,

    @Size(max = 5000, message = "Description must be 5000 characters or fewer.")
    String description,

    @NotNull(message = "Price is required.")
    @DecimalMin(value = "0.00", inclusive = false, message = "Price must be greater than 0.")
    @Digits(integer = 8, fraction = 2, message = "Price can have up to 8 whole digits and 2 decimal places.")
    BigDecimal price,

    @Size(max = 500, message = "Image URL must be 500 characters or fewer.")
    @Pattern(regexp = "^(https?://\\S+)?$", message = "Image URL must be a valid HTTP or HTTPS URL.")
    String imageUrl,

    @NotBlank(message = "Category is required.")
    @Size(max = 60, message = "Category must be 60 characters or fewer.")
    String category,

    @NotNull(message = "Availability is required.")
    Boolean available
) {}
