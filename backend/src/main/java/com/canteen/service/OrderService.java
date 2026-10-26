package com.canteen.service;

import com.canteen.dto.order.CreateOrderItemRequest;
import com.canteen.dto.order.CreateOrderRequest;
import com.canteen.dto.order.OrderResponse;
import com.canteen.entity.Dish;
import com.canteen.entity.FoodOrder;
import com.canteen.entity.OrderItem;
import com.canteen.entity.User;
import com.canteen.enums.OrderStatus;
import com.canteen.enums.PaymentMethod;
import com.canteen.enums.PaymentStatus;
import com.canteen.exception.BusinessRuleException;
import com.canteen.exception.ForbiddenOperationException;
import com.canteen.exception.ResourceNotFoundException;
import com.canteen.repository.DishRepository;
import com.canteen.repository.FoodOrderRepository;
import com.canteen.repository.UserRepository;
import com.canteen.websocket.EventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class OrderService {

    private final FoodOrderRepository orderRepository;
    private final DishRepository dishRepository;
    private final UserRepository userRepository;
    private final EventPublisher eventPublisher;

    public OrderService(FoodOrderRepository orderRepository,
                        DishRepository dishRepository,
                        UserRepository userRepository,
                        EventPublisher eventPublisher) {
        this.orderRepository = orderRepository;
        this.dishRepository = dishRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail.trim().toLowerCase())
            .orElseThrow(() -> new BusinessRuleException("USER_NOT_FOUND", "Authenticated user not found."));

        if (request.items() == null || request.items().isEmpty()) {
            throw new BusinessRuleException("EMPTY_CART", "Order must contain at least one item.");
        }

        if (request.paymentMethod() != PaymentMethod.CASH) {
            throw new BusinessRuleException("UNSUPPORTED_PAYMENT_METHOD", "Only CASH payment at counter is supported.");
        }

        BigDecimal calculatedTotal = BigDecimal.ZERO;
        String tokenNumber = generateUniqueToken();

        FoodOrder order = new FoodOrder(
            tokenNumber,
            user,
            BigDecimal.ZERO,
            OrderStatus.PLACED,
            PaymentMethod.CASH,
            PaymentStatus.UNPAID
        );

        for (CreateOrderItemRequest itemReq : request.items()) {
            Dish dish = dishRepository.findById(itemReq.dishId())
                .orElseThrow(() -> new ResourceNotFoundException("Dish not found with id: " + itemReq.dishId()));

            if (!dish.isAvailable()) {
                throw new BusinessRuleException("DISH_UNAVAILABLE",
                    "Dish '" + dish.getName() + "' is currently sold out and cannot be ordered.");
            }

            if (itemReq.quantity() < 1 || itemReq.quantity() > 20) {
                throw new BusinessRuleException("INVALID_QUANTITY",
                    "Quantity for '" + dish.getName() + "' must be between 1 and 20.");
            }

            BigDecimal unitPrice = dish.getPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.quantity()));
            calculatedTotal = calculatedTotal.add(subtotal);

            OrderItem orderItem = new OrderItem(
                dish,
                dish.getName(),
                itemReq.quantity(),
                unitPrice,
                subtotal
            );
            order.addItem(orderItem);
        }

        order.setTotalAmount(calculatedTotal);
        FoodOrder savedOrder = orderRepository.save(order);

        // Publish real-time event to staff queue and tracking
        eventPublisher.publishOrderCreated(savedOrder);

        return OrderResponse.fromEntity(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getStudentOrders(String userEmail) {
        User user = userRepository.findByEmail(userEmail.trim().toLowerCase())
            .orElseThrow(() -> new BusinessRuleException("USER_NOT_FOUND", "Authenticated user not found."));
        List<FoodOrder> orders = orderRepository.findByUserIdWithItems(user.getId());
        return orders.stream().map(OrderResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id, String userEmail, boolean isStaff) {
        FoodOrder order = orderRepository.findByIdWithItems(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        if (!isStaff && !order.getUser().getEmail().equalsIgnoreCase(userEmail.trim())) {
            throw new ForbiddenOperationException("You are not authorized to view another student's order.");
        }

        return OrderResponse.fromEntity(order);
    }

    @Transactional
    public OrderResponse cancelOrder(Long id, String userEmail, boolean isStaff) {
        FoodOrder order = orderRepository.findByIdWithItems(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        if (!isStaff && !order.getUser().getEmail().equalsIgnoreCase(userEmail.trim())) {
            throw new ForbiddenOperationException("You are not authorized to cancel this order.");
        }

        if (order.getStatus() != OrderStatus.PLACED && order.getStatus() != OrderStatus.ACCEPTED) {
            throw new BusinessRuleException("CANCELLATION_NOT_ALLOWED",
                "Order cannot be cancelled because it is already " + order.getStatus() + ". Cancellation is permitted only while PLACED or ACCEPTED.");
        }

        order.setStatus(OrderStatus.CANCELLED);
        FoodOrder saved = orderRepository.save(order);

        eventPublisher.publishOrderStatusUpdated(saved);

        return OrderResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getStaffActiveOrders() {
        List<OrderStatus> activeStatuses = List.of(
            OrderStatus.PLACED,
            OrderStatus.ACCEPTED,
            OrderStatus.PREPARING,
            OrderStatus.READY
        );
        List<FoodOrder> orders = orderRepository.findByStatusInWithItemsAsc(activeStatuses);
        return orders.stream().map(OrderResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getStaffOrderHistory() {
        List<OrderStatus> historyStatuses = List.of(
            OrderStatus.COMPLETED,
            OrderStatus.CANCELLED
        );
        List<FoodOrder> orders = orderRepository.findByStatusInWithItemsDesc(historyStatuses);
        return orders.stream().map(OrderResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getStaffOrdersByStatus(OrderStatus status) {
        List<FoodOrder> orders = orderRepository.findByStatusWithItemsAsc(status);
        return orders.stream().map(OrderResponse::fromEntity).toList();
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatus newStatus) {
        FoodOrder order = orderRepository.findByIdWithItems(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        validateStatusTransition(order.getStatus(), newStatus);

        order.setStatus(newStatus);
        FoodOrder saved = orderRepository.save(order);

        eventPublisher.publishOrderStatusUpdated(saved);

        return OrderResponse.fromEntity(saved);
    }

    @Transactional
    public OrderResponse updatePaymentStatus(Long id, PaymentStatus newPaymentStatus) {
        FoodOrder order = orderRepository.findByIdWithItems(id)
            .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        order.setPaymentStatus(newPaymentStatus);
        FoodOrder saved = orderRepository.save(order);

        eventPublisher.publishOrderStatusUpdated(saved);

        return OrderResponse.fromEntity(saved);
    }

    private void validateStatusTransition(OrderStatus current, OrderStatus next) {
        if (current == next) {
            return;
        }

        boolean valid = switch (current) {
            case PLACED -> next == OrderStatus.ACCEPTED || next == OrderStatus.CANCELLED;
            case ACCEPTED -> next == OrderStatus.PREPARING || next == OrderStatus.CANCELLED;
            case PREPARING -> next == OrderStatus.READY;
            case READY -> next == OrderStatus.COMPLETED;
            case COMPLETED, CANCELLED -> false;
        };

        if (!valid) {
            throw new BusinessRuleException("INVALID_STATUS_TRANSITION",
                "Cannot transition order from status " + current + " to " + next + ".");
        }
    }

    private String generateUniqueToken() {
        String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
        String token;
        int attempts = 0;
        do {
            int randomNum = ThreadLocalRandom.current().nextInt(100, 999);
            token = "C-" + datePrefix + "-" + randomNum;
            attempts++;
            if (attempts > 100) {
                token = "C-" + System.currentTimeMillis();
                break;
            }
        } while (orderRepository.findByTokenNumber(token).isPresent());

        return token;
    }
}
