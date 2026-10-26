package com.canteen.controller;

import com.canteen.dto.dish.DishResponse;
import com.canteen.dto.dish.UpdateAvailabilityRequest;
import com.canteen.dto.order.OrderResponse;
import com.canteen.dto.order.UpdateOrderStatusRequest;
import com.canteen.dto.order.UpdatePaymentStatusRequest;
import com.canteen.entity.Dish;
import com.canteen.enums.OrderStatus;
import com.canteen.repository.DishRepository;
import com.canteen.service.DishService;
import com.canteen.service.OrderService;
import com.canteen.websocket.EventPublisher;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@PreAuthorize("hasRole('STAFF')")
public class StaffController {

    private final OrderService orderService;
    private final DishService dishService;
    private final DishRepository dishRepository;
    private final EventPublisher eventPublisher;

    public StaffController(OrderService orderService,
                           DishService dishService,
                           DishRepository dishRepository,
                           EventPublisher eventPublisher) {
        this.orderService = orderService;
        this.dishService = dishService;
        this.dishRepository = dishRepository;
        this.eventPublisher = eventPublisher;
    }

    @GetMapping("/orders/active")
    public ResponseEntity<List<OrderResponse>> getActiveOrders() {
        return ResponseEntity.ok(orderService.getStaffActiveOrders());
    }

    @GetMapping("/orders/history")
    public ResponseEntity<List<OrderResponse>> getOrderHistory() {
        return ResponseEntity.ok(orderService.getStaffOrderHistory());
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> getOrdersByStatus(
            @RequestParam(name = "status") OrderStatus status) {
        return ResponseEntity.ok(orderService.getStaffOrdersByStatus(status));
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateOrderStatusRequest request) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, request.status()));
    }

    @PatchMapping("/orders/{id}/payment")
    public ResponseEntity<OrderResponse> updatePaymentStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePaymentStatusRequest request) {
        return ResponseEntity.ok(orderService.updatePaymentStatus(id, request.paymentStatus()));
    }

    @PatchMapping("/dishes/{id}/availability")
    public ResponseEntity<DishResponse> updateDishAvailability(
            @PathVariable Long id,
            @RequestBody UpdateAvailabilityRequest request) {
        DishResponse response = dishService.updateAvailability(id, request.available());
        // Also trigger real-time broadcast to all clients
        Dish dish = dishRepository.findById(id).orElse(null);
        if (dish != null) {
            eventPublisher.publishDishAvailabilityUpdated(dish);
        }
        return ResponseEntity.ok(response);
    }
}
