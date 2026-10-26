package com.canteen.dto.dish;

import com.canteen.entity.Dish;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record DishResponse(
    Long id,
    String name,
    String description,
    BigDecimal price,
    String imageUrl,
    String category,
    boolean available,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
    public static DishResponse fromEntity(Dish dish) {
        return new DishResponse(
            dish.getId(),
            dish.getName(),
            dish.getDescription(),
            dish.getPrice(),
            dish.getImageUrl(),
            dish.getCategory(),
            dish.isAvailable(),
            dish.getCreatedAt(),
            dish.getUpdatedAt()
        );
    }
}
