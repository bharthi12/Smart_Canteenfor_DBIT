package com.canteen.websocket;

public record DishEvent(
    String type,
    Long dishId,
    String dishName,
    boolean available,
    String updatedAt
) {}
