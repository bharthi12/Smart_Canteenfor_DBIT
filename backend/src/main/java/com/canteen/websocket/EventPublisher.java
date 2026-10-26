package com.canteen.websocket;

import com.canteen.entity.Dish;
import com.canteen.entity.FoodOrder;

public interface EventPublisher {
    void publishOrderCreated(FoodOrder order);
    void publishOrderStatusUpdated(FoodOrder order);
    void publishDishAvailabilityUpdated(Dish dish);
}
