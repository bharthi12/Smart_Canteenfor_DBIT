package com.canteen.controller;

import com.canteen.dto.order.CreateOrderRequest;
import com.canteen.dto.order.OrderResponse;
import com.canteen.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            Principal principal) {
        OrderResponse response = orderService.createOrder(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my")
    public ResponseEntity<List<OrderResponse>> getMyOrders(Principal principal) {
        return ResponseEntity.ok(orderService.getStudentOrders(principal.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(
            @PathVariable Long id,
            Authentication authentication) {
        boolean isStaff = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_STAFF"));
        return ResponseEntity.ok(orderService.getOrderById(id, authentication.getName(), isStaff));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
            @PathVariable Long id,
            Authentication authentication) {
        boolean isStaff = authentication.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_STAFF"));
        return ResponseEntity.ok(orderService.cancelOrder(id, authentication.getName(), isStaff));
    }
}
