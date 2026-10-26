package com.canteen.service;

import com.canteen.dto.order.CreateOrderItemRequest;
import com.canteen.dto.order.CreateOrderRequest;
import com.canteen.dto.order.OrderResponse;
import com.canteen.entity.Dish;
import com.canteen.entity.FoodOrder;
import com.canteen.entity.User;
import com.canteen.enums.OrderStatus;
import com.canteen.enums.PaymentMethod;
import com.canteen.enums.PaymentStatus;
import com.canteen.enums.Role;
import com.canteen.exception.BusinessRuleException;
import com.canteen.exception.ForbiddenOperationException;
import com.canteen.repository.DishRepository;
import com.canteen.repository.FoodOrderRepository;
import com.canteen.repository.UserRepository;
import com.canteen.websocket.EventPublisher;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private FoodOrderRepository orderRepository;

    @Mock
    private DishRepository dishRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private OrderService orderService;

    private User studentUser;
    private Dish availableDish;
    private Dish soldOutDish;

    @BeforeEach
    void setUp() {
        studentUser = new User("Rahul Sharma", "rahul@college.edu", "hashedpw", Role.STUDENT);
        studentUser.setId(10L);

        availableDish = new Dish("Masala Dosa", "Crispy crepe", new BigDecimal("60.00"), "url", "Breakfast", true);
        availableDish.setId(1L);

        soldOutDish = new Dish("Brownie", "Chocolate treat", new BigDecimal("70.00"), "url", "Desserts", false);
        soldOutDish.setId(2L);
    }

    @Test
    @DisplayName("Should successfully create order and calculate exact BigDecimal total")
    void testCreateOrderSuccess() {
        when(userRepository.findByEmail("rahul@college.edu")).thenReturn(Optional.of(studentUser));
        when(dishRepository.findById(1L)).thenReturn(Optional.of(availableDish));
        when(orderRepository.save(any(FoodOrder.class))).thenAnswer(invocation -> {
            FoodOrder order = invocation.getArgument(0);
            order.setId(101L);
            return order;
        });

        CreateOrderRequest request = new CreateOrderRequest(
            PaymentMethod.CASH,
            List.of(new CreateOrderItemRequest(1L, 2))
        );

        OrderResponse response = orderService.createOrder(request, "rahul@college.edu");

        assertNotNull(response);
        assertEquals(new BigDecimal("120.00"), response.totalAmount());
        assertEquals(OrderStatus.PLACED, response.status());
        assertEquals(PaymentMethod.CASH, response.paymentMethod());
        assertEquals(PaymentStatus.UNPAID, response.paymentStatus());
        verify(eventPublisher, times(1)).publishOrderCreated(any(FoodOrder.class));
    }

    @Test
    @DisplayName("Should reject order when a dish is sold out")
    void testCreateOrderWithUnavailableDishFails() {
        when(userRepository.findByEmail("rahul@college.edu")).thenReturn(Optional.of(studentUser));
        when(dishRepository.findById(2L)).thenReturn(Optional.of(soldOutDish));

        CreateOrderRequest request = new CreateOrderRequest(
            PaymentMethod.CASH,
            List.of(new CreateOrderItemRequest(2L, 1))
        );

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
            orderService.createOrder(request, "rahul@college.edu")
        );

        assertEquals("DISH_UNAVAILABLE", ex.getCode());
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should allow cancellation from PLACED or ACCEPTED only")
    void testCancellationRules() {
        FoodOrder placedOrder = new FoodOrder("TK-001", studentUser, new BigDecimal("60.00"), OrderStatus.PLACED, PaymentMethod.CASH, PaymentStatus.UNPAID);
        placedOrder.setId(1L);

        when(orderRepository.findByIdWithItems(1L)).thenReturn(Optional.of(placedOrder));
        when(orderRepository.save(any(FoodOrder.class))).thenReturn(placedOrder);

        OrderResponse cancelledResponse = orderService.cancelOrder(1L, "rahul@college.edu", false);
        assertEquals(OrderStatus.CANCELLED, cancelledResponse.status());

        // Test that PREPARING order cannot be cancelled
        FoodOrder preparingOrder = new FoodOrder("TK-002", studentUser, new BigDecimal("60.00"), OrderStatus.PREPARING, PaymentMethod.CASH, PaymentStatus.UNPAID);
        preparingOrder.setId(2L);
        when(orderRepository.findByIdWithItems(2L)).thenReturn(Optional.of(preparingOrder));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
            orderService.cancelOrder(2L, "rahul@college.edu", false)
        );
        assertEquals("CANCELLATION_NOT_ALLOWED", ex.getCode());
    }

    @Test
    @DisplayName("Should prevent student A from cancelling or viewing student B's order")
    void testStudentCannotCancelOtherStudentOrder() {
        User studentB = new User("Priya Nair", "priya@college.edu", "hashedpw", Role.STUDENT);
        studentB.setId(20L);

        FoodOrder orderOfB = new FoodOrder("TK-003", studentB, new BigDecimal("100.00"), OrderStatus.PLACED, PaymentMethod.CASH, PaymentStatus.UNPAID);
        orderOfB.setId(3L);

        when(orderRepository.findByIdWithItems(3L)).thenReturn(Optional.of(orderOfB));

        assertThrows(ForbiddenOperationException.class, () ->
            orderService.cancelOrder(3L, "rahul@college.edu", false)
        );

        assertThrows(ForbiddenOperationException.class, () ->
            orderService.getOrderById(3L, "rahul@college.edu", false)
        );
    }

    @Test
    @DisplayName("Should enforce valid status progression")
    void testStatusProgressionRules() {
        FoodOrder order = new FoodOrder("TK-004", studentUser, new BigDecimal("60.00"), OrderStatus.PLACED, PaymentMethod.CASH, PaymentStatus.UNPAID);
        order.setId(4L);
        when(orderRepository.findByIdWithItems(4L)).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenReturn(order);

        // PLACED -> ACCEPTED is valid
        assertDoesNotThrow(() -> orderService.updateOrderStatus(4L, OrderStatus.ACCEPTED));

        // Skip to COMPLETED from PLACED is invalid
        order.setStatus(OrderStatus.PLACED);
        assertThrows(BusinessRuleException.class, () ->
            orderService.updateOrderStatus(4L, OrderStatus.COMPLETED)
        );
    }
}
