# Smart Canteen --- Agent Implementation Guide

## 1. Project objective

Build a full-stack college canteen ordering and management website using
React, Java Spring Boot, and MySQL.

There are exactly two roles: - **STUDENT**: verified college-email
login, browse fixed menu, see Available/Sold Out status, cart, place
cash-at-counter orders, receive token, track orders live, view order
history, cancel eligible orders. - **STAFF**: pre-provisioned login,
view incoming order queue, accept/prepare/mark ready/complete orders,
toggle dish availability, and mark cash as received.

No online payment, quantity-based stock tracking, or separate admin role
in this version.

## 2. Technology stack

-   Frontend: React, Vite, JavaScript, React Router, CSS.
-   Backend: Java 21, Spring Boot, Maven.
-   Database: MySQL, Spring Data JPA/Hibernate.
-   Security: Spring Security, secure session cookie, password hashing.
-   Real-time: Spring WebSocket with STOMP.
-   Validation: Jakarta Bean Validation.
-   Testing: JUnit, Spring Boot Test, Postman.
-   Version control: Git.

Use a Spring Boot release compatible with the installed Java version.
Inspect the repository before changing it and preserve existing working
conventions.

## 3. Repository structure

``` text
smart-canteen/
├── implementation.md
├── README.md
├── .gitignore
├── frontend/
│   ├── package.json
│   └── src/
│       ├── assets/
│       ├── components/
│       │   ├── Navbar.jsx
│       │   ├── DishCard.jsx
│       │   ├── CartItem.jsx
│       │   ├── OrderStatus.jsx
│       │   └── ProtectedRoute.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   ├── Menu.jsx
│       │   ├── Cart.jsx
│       │   ├── MyOrders.jsx
│       │   ├── OrderTracking.jsx
│       │   └── StaffDashboard.jsx
│       ├── services/
│       │   ├── api.js
│       │   ├── authService.js
│       │   ├── menuService.js
│       │   ├── orderService.js
│       │   └── socketService.js
│       ├── context/AuthContext.jsx
│       ├── hooks/
│       ├── utils/
│       ├── App.jsx
│       ├── main.jsx
│       └── styles/global.css
├── backend/
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/canteen/
│       │   ├── SmartCanteenApplication.java
│       │   ├── config/SecurityConfig.java
│       │   ├── config/WebSocketConfig.java
│       │   ├── controller/AuthController.java
│       │   ├── controller/MenuController.java
│       │   ├── controller/OrderController.java
│       │   ├── controller/StaffController.java
│       │   ├── dto/
│       │   ├── entity/User.java
│       │   ├── entity/Dish.java
│       │   ├── entity/FoodOrder.java
│       │   ├── entity/OrderItem.java
│       │   ├── enums/Role.java
│       │   ├── enums/OrderStatus.java
│       │   ├── enums/PaymentStatus.java
│       │   ├── exception/
│       │   ├── repository/
│       │   ├── service/
│       │   └── websocket/
│       ├── main/resources/application.properties
│       └── test/
└── database/seed-dishes.sql
```

## 4. Functional requirements

### Student

1.  Register/login using a verified college email.
2.  Browse the fixed menu grouped by category.
3.  View dish name, description, price, optional image, and
    availability.
4.  Add available dishes to cart and change quantities.
5.  Place orders using cash at the counter.
6.  Receive a unique order token and track order status in real time.
7.  View their own current and past orders.
8.  Cancel only orders allowed by the cancellation policy.
9.  Never access another student's orders or staff-only functionality.

### Staff

1.  Log in with a pre-provisioned STAFF account.
2.  View incoming orders, oldest first.
3.  View token, items, quantities, total, creation time, and payment
    status.
4.  Update order status.
5.  Toggle dish availability.
6.  Mark cash as paid only after receiving it.
7.  View active and completed orders.

Public registration must always create STUDENT accounts. Never accept a
role from the registration request. Do not invent the college email
domain; make it configurable. A domain suffix check alone is not proof
of email ownership, so use email verification or an institution-approved
identity provider.

## 5. Database schema

Use migrations or JPA schema management appropriate for the environment.
Add primary keys, foreign keys, unique constraints, and useful indexes.

### `users`

-   `id`: BIGINT primary key, generated.
-   `name`: VARCHAR(100), required.
-   `email`: VARCHAR(255), unique and required.
-   `password_hash`: VARCHAR(255), required.
-   `role`: STUDENT or STAFF, required.
-   `enabled`: BOOLEAN, required.
-   `created_at`: timestamp.

### `dishes`

-   `id`: BIGINT primary key, generated.
-   `name`: VARCHAR(120), required.
-   `description`: TEXT, optional.
-   `price`: DECIMAL(10,2), non-negative.
-   `image_url`: VARCHAR(500), optional.
-   `category`: VARCHAR(60), required.
-   `available`: BOOLEAN, default true.
-   `created_at`, `updated_at`: timestamps.

### `food_orders`

-   `id`: BIGINT primary key, generated.
-   `token_number`: VARCHAR(30), unique.
-   `user_id`: foreign key to `users.id`.
-   `total_amount`: DECIMAL(10,2).
-   `status`: PLACED, ACCEPTED, PREPARING, READY, COMPLETED, or
    CANCELLED.
-   `payment_method`: CASH.
-   `payment_status`: UNPAID or PAID.
-   `created_at`, `updated_at`: timestamps.

### `order_items`

-   `id`: BIGINT primary key, generated.
-   `order_id`: foreign key to `food_orders.id`.
-   `dish_id`: foreign key to `dishes.id`.
-   `dish_name`: VARCHAR(120), snapshot at order time.
-   `quantity`: positive integer.
-   `unit_price`: DECIMAL(10,2), snapshot at order time.
-   `subtotal`: DECIMAL(10,2).

Relationships: one user has many orders; one order has one or more
items; each item references a dish. Use Java `BigDecimal` for money. Use
transactions for order creation. This version tracks availability as a
boolean, not quantity.

## 6. REST API contract

All endpoints use `/api` and JSON. Return correct HTTP status codes and
consistent error responses.

### Authentication

-   `POST /api/auth/register` --- register student only.
-   `POST /api/auth/login` --- authenticate.
-   `GET /api/auth/me` --- return current user ID, name, email, and
    role.
-   `POST /api/auth/logout` --- invalidate session.

### Menu

-   `GET /api/dishes` --- all dishes.
-   `GET /api/dishes?available=true` --- available dishes.
-   `GET /api/dishes/{id}` --- one dish.
-   `PATCH /api/staff/dishes/{id}/availability` --- staff-only
    availability change.

### Student orders

-   `POST /api/orders` --- create order.
-   `GET /api/orders/my` --- only the authenticated student's orders.
-   `GET /api/orders/{id}` --- only the owner or staff may view it.
-   `PATCH /api/orders/{id}/cancel` --- cancel an eligible order.

Example create-order request:

``` json
{
  "paymentMethod": "CASH",
  "items": [
    { "dishId": 1, "quantity": 2 },
    { "dishId": 4, "quantity": 1 }
  ]
}
```

The server fetches prices and availability and calculates the total.
Never trust frontend `userId`, role, or total. Reject empty carts,
invalid quantities, missing dishes, unavailable dishes, and unsupported
payment methods.

### Staff orders

-   `GET /api/staff/orders?status=PLACED` --- filter by status.
-   `GET /api/staff/orders/active` --- active queue.
-   `GET /api/staff/orders/history` --- completed/cancelled history.
-   `PATCH /api/staff/orders/{id}/status` --- change status.
-   `PATCH /api/staff/orders/{id}/payment` --- mark cash paid after
    collection.

Suggested status flow:

`PLACED -> ACCEPTED -> PREPARING -> READY -> COMPLETED`

Cancellation is allowed from PLACED or ACCEPTED only, unless the college
defines another policy. Reject invalid transitions with a clear 4xx
response.

## 7. Real-time events

Use Spring WebSocket with STOMP. Suggested destinations: -
`/topic/staff/orders` --- new orders; authenticated STAFF only. -
`/topic/orders/{orderId}` --- updates for the order owner or STAFF. -
`/topic/dishes` --- availability changes.

Authenticate WebSocket connections and authorize subscriptions. Do not
let clients publish trusted status, order, or availability events
directly. Publish events only after successful database commit. On
reconnect, refetch current state via REST.

Example event:

``` json
{
  "type": "ORDER_STATUS_UPDATED",
  "orderId": 123,
  "tokenNumber": "C123",
  "status": "READY",
  "updatedAt": "server-generated timestamp"
}
```

The timestamp above is descriptive placeholder text; use an actual
server timestamp in the implementation.

## 8. Frontend routes

-   `/login`
-   `/register`
-   `/menu`
-   `/cart`
-   `/orders`
-   `/orders/:id`
-   `/staff`

Use a shared authentication context. Redirect unauthenticated users to
login. Prevent STUDENT from using `/staff` and STAFF from using student
checkout. Frontend route guards improve UX but backend authorization is
mandatory. Include loading, empty, error, and success states; responsive
layouts; cancellation confirmation; and WebSocket reconnect/refetch
handling.

## 9. Security and correctness

1.  Hash passwords with BCrypt or another strong password encoder; never
    store plaintext passwords.
2.  Enforce role and order-ownership checks on the backend.
3.  Use secure, HTTP-only session cookies in production and configure
    CSRF protection appropriately.
4.  Restrict CORS to configured frontend origins.
5.  Keep database credentials and secrets in environment variables.
6.  Validate input with DTOs and Jakarta Bean Validation.
7.  Use `BigDecimal` for money.
8.  Use transactions for order creation and status changes.
9.  Generate unique tokens safely; do not use a non-atomic order count.
10. Prevent duplicate submissions where practical.
11. Do not expose private student data on public WebSocket topics.
12. Do not return stack traces or secrets to clients.
13. Re-check availability on the server at order submission time.

## 10. Step-by-step implementation phases

### Phase 1 --- Setup

-   Create React/Vite frontend and Spring Boot backend.
-   Configure MySQL using environment variables.
-   Create entities, repositories, and seed dishes.
-   Confirm backend starts and connects to MySQL.

**Acceptance:** `GET /api/dishes` returns JSON from MySQL.

### Phase 2 --- Menu UI

-   Build menu and dish cards.
-   Show category, price, and availability.
-   Add cart and quantity controls.

**Acceptance:** menu loads from the API and sold-out dishes cannot be
added.

### Phase 3 --- Authentication

-   Implement registration, login, logout, current-user endpoint, and
    email verification strategy.
-   Add STUDENT/STAFF authorization.
-   Provision a staff account securely.

**Acceptance:** public registration cannot create staff; protected APIs
reject unauthorized requests.

### Phase 4 --- Ordering

-   Implement entities, repositories, DTOs, and services.
-   Validate availability and quantities.
-   Calculate totals and snapshots server-side.
-   Generate unique token; set payment to CASH/UNPAID.
-   Add order history and cancellation.

**Acceptance:** valid orders persist; invalid requests are rejected
without partial orders.

### Phase 5 --- Staff dashboard

-   Implement order queue and status controls.
-   Add availability toggle and cash payment confirmation.

**Acceptance:** staff changes persist; students cannot call staff
endpoints.

### Phase 6 --- Real-time

-   Configure WebSocket/STOMP.
-   Broadcast new orders, status changes, and availability changes.
-   Implement reconnect/refetch behaviour.

**Acceptance:** both dashboards update without manual refresh, and
subscriptions are authorized.

### Phase 7 --- Testing and documentation

-   Add unit/integration tests for order creation, status transitions,
    and access control.
-   Test that student A cannot read student B's order.
-   Test unavailable dishes, invalid quantities, duplicate requests, and
    payment status.
-   Document setup, environment variables, seed data, and run commands.

**Acceptance:** a clean checkout can be run using the documented
instructions.

## 11. Instructions for the coding agent

1.  Inspect the existing repository before modifying files; preserve
    working code.
2.  Implement in the phases above, in order.
3.  Before each phase, briefly state files to be created/changed.
4.  Do not leave core functionality as TODOs, mock responses, or
    frontend-only hardcoded data after its backend phase.
5.  Keep controllers thin; put business rules in services and
    persistence in repositories.
6.  Use DTOs instead of exposing JPA entities directly.
7.  Use enums for roles, order status, and payment status.
8.  Add tests for critical business and security rules.
9.  Run available builds and tests after each phase; fix failures before
    continuing.
10. Make unknown values, especially the college email domain,
    configurable instead of inventing them.
11. Do not add online payment, quantity stock, or an admin role unless
    requested later.
12. At completion, report file tree, implemented features, run commands,
    environment variables, test results, and limitations.

## 12. Definition of done

-   Students can sign in using verified college accounts.
-   Students see the fixed menu and live availability.
-   Students place cash-at-counter orders and receive unique tokens.
-   Staff see incoming orders and update status.
-   Staff toggle dishes available/sold out.
-   Students see real-time updates and order history.
-   Staff mark cash as paid after collection.
-   Backend enforces role and ownership checks.
-   Data persists in MySQL.
-   Setup and testing instructions are documented.
