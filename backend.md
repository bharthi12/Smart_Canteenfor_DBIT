# Smart Canteen — Java Backend Implementation Guide

> This document explains how to implement the backend in Java Spring Boot. It complements `implementation.md` (overall project plan) and `ui.md` (frontend design). If requirements conflict, preserve the business rules and API contract in `implementation.md`. This document must not introduce an admin role, online payment, or quantity-based inventory.

## 1. Backend goals

Build a secure REST API and real-time event service for a college canteen.

The backend must support:
- Student registration/login and session identity.
- A fixed menu stored in MySQL.
- Boolean dish availability (`available` / `sold out`), not quantity inventory.
- Cash-at-counter orders.
- A staff queue to accept and prepare orders.
- Real-time order-status and availability updates.
- Strict role and order-ownership checks.
- Reliable validation, transactions, error responses, and tests.

## 2. Technology

- Java 21 (or the Java version supported by the selected Spring Boot release).
- Spring Boot: Spring Web, Spring Data JPA, Spring Security, Validation, WebSocket.
- Maven.
- MySQL.
- BCrypt password encoder.
- Spring WebSocket with STOMP for server-pushed events.
- JUnit 5, Spring Boot Test, and optionally Testcontainers for integration tests.

Use dependency versions managed by the Spring Boot parent/BOM. Do not pin conflicting versions unnecessarily.

## 3. Package structure

Use a feature-oriented layered structure:

```text
backend/
├── pom.xml
└── src/
    ├── main/
    │   ├── java/com/canteen/
    │   │   ├── SmartCanteenApplication.java
    │   │   ├── config/
    │   │   │   ├── SecurityConfig.java
    │   │   │   ├── WebSocketConfig.java
    │   │   │   └── CorsConfig.java
    │   │   ├── controller/
    │   │   │   ├── AuthController.java
    │   │   │   ├── DishController.java
    │   │   │   ├── OrderController.java
    │   │   │   └── StaffController.java
    │   │   ├── dto/
    │   │   │   ├── auth/
    │   │   │   ├── dish/
    │   │   │   ├── order/
    │   │   │   └── common/
    │   │   ├── entity/
    │   │   │   ├── User.java
    │   │   │   ├── Dish.java
    │   │   │   ├── FoodOrder.java
    │   │   │   └── OrderItem.java
    │   │   ├── enums/
    │   │   │   ├── Role.java
    │   │   │   ├── OrderStatus.java
    │   │   │   ├── PaymentMethod.java
    │   │   │   └── PaymentStatus.java
    │   │   ├── exception/
    │   │   │   ├── ApiExceptionHandler.java
    │   │   │   ├── ResourceNotFoundException.java
    │   │   │   ├── BusinessRuleException.java
    │   │   │   └── ForbiddenOperationException.java
    │   │   ├── repository/
    │   │   ├── security/
    │   │   ├── service/
    │   │   └── websocket/
    │   └── resources/
    │       ├── application.properties
    │       └── db/
    │           └── migration/
    └── test/java/com/canteen/
```

### Layer responsibilities

- **Controller:** HTTP mapping, request DTO validation, response codes. Keep business logic out.
- **Service:** business rules, role/ownership checks, transactions, calculations, status transitions.
- **Repository:** database reads/writes using Spring Data JPA.
- **Entity:** persistence model only; never return entities directly to the client.
- **DTO:** explicit API request/response shape.
- **Config/Security:** authentication, route access, CORS, WebSocket security.
- **Exception handler:** consistent, safe API errors.
- **WebSocket publisher:** publish trusted events after successful database changes.

## 4. Domain model and database mapping

Use the schema in `implementation.md`. Map the following entities.

### `User`
Fields: `id`, `name`, `email`, `passwordHash`, `role`, `enabled`, `createdAt`.

- `email` must be unique and normalised (trim and lowercase).
- `passwordHash` stores only a BCrypt hash.
- `role` is an enum: `STUDENT` or `STAFF`.
- Public registration must always create `STUDENT`.
- Staff accounts are provisioned through a controlled setup process, not public registration.

### `Dish`
Fields: `id`, `name`, `description`, `price`, `imageUrl`, `category`, `available`, `createdAt`, `updatedAt`.

- Use `BigDecimal` for price.
- Reject negative prices.
- `available` is a boolean. Do not add quantity stock fields in this version.
- Staff can toggle availability but cannot create or change the fixed menu through the API unless that feature is separately approved.

### `FoodOrder`
Fields: `id`, `tokenNumber`, `user`, `totalAmount`, `status`, `paymentMethod`, `paymentStatus`, `createdAt`, `updatedAt`.

- `paymentMethod` is `CASH`.
- `paymentStatus` begins as `UNPAID`.
- `tokenNumber` must be unique.
- Store the order's final amount calculated by the backend.
- Use `@Version` optimistic locking if useful to avoid concurrent status updates overwriting each other.

### `OrderItem`
Fields: `id`, `order`, `dish`, `dishName`, `quantity`, `unitPrice`, `subtotal`.

- `quantity` must be a positive integer.
- `dishName` and `unitPrice` are snapshots taken when the order is created. Past orders must not change if the menu label or price changes later.
- Calculate `subtotal = unitPrice × quantity` on the server.

### Enums

```java
public enum Role {
    STUDENT, STAFF
}

public enum OrderStatus {
    PLACED, ACCEPTED, PREPARING, READY, COMPLETED, CANCELLED
}

public enum PaymentMethod {
    CASH
}

public enum PaymentStatus {
    UNPAID, PAID
}
```

Use enum values consistently across Java, database, REST responses, and frontend code.

## 5. MySQL and configuration

Keep credentials out of source control. Configure using environment variables, for example:

```properties
spring.application.name=smart-canteen
server.port=${SERVER_PORT:8080}

spring.datasource.url=${DB_URL:jdbc:mysql://localhost:3306/smart_canteen}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

spring.jpa.open-in-view=false
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.properties.hibernate.format_sql=true

app.college.email-domain=${COLLEGE_EMAIL_DOMAIN:}
app.frontend-origin=${FRONTEND_ORIGIN:http://localhost:5173}
```

Set up schema migrations with Flyway (recommended) or an explicitly chosen equivalent. If using Flyway, create versioned scripts under `src/main/resources/db/migration/` and use Hibernate `validate` rather than allowing production schema changes automatically.

Local environment values should be supplied in an untracked `.env` file or shell environment. Commit an `.env.example` containing placeholders only.

Seed the fixed dishes using a migration or a repeatable seed process. Avoid creating duplicate dishes every time the app starts.

## 6. Authentication and authorization

### Session approach

For this project, use Spring Security with a server-side session and secure session cookie. The browser should not store passwords or session IDs in local storage.

- `POST /api/auth/login`: authenticate credentials and establish the session.
- `GET /api/auth/me`: return current user's public identity.
- `POST /api/auth/logout`: invalidate the session.
- Configure cookie `HttpOnly`, `Secure` in HTTPS deployments, and an appropriate `SameSite` policy.
- Configure CSRF protection for cookie-based authentication. The frontend must send the CSRF token for state-changing requests as configured by Spring Security.
- Restrict CORS to the configured frontend origin and allow credentials only for that origin.

### Registration

`POST /api/auth/register` accepts only name, email, and password. The service must:
1. Normalise the email.
2. Validate required fields and password policy.
3. Check the configured college email domain if one is configured.
4. Apply the selected email-verification or institution-approved identity strategy before treating the account as verified.
5. Hash the password with BCrypt.
6. Create the account with role `STUDENT` regardless of request content.

Do not treat an email suffix check alone as proof that the person owns that email. Never accept `role`, `enabled`, or `passwordHash` from the client.

### Role checks

- Public: register and login.
- Authenticated student: menu, own orders, order creation, eligible cancellation.
- Staff only: staff order queue, order status updates, dish availability updates, payment confirmation.
- An order can be viewed by its owner or staff only.

Enforce these rules on the backend even if React has protected routes. Prefer method security such as `@PreAuthorize("hasRole('STAFF')")` where suitable, plus explicit ownership checks in services.

## 7. REST API implementation

All endpoints are under `/api`. Use DTOs, validation annotations, and consistent HTTP codes.

### Authentication controller

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Example registration DTO:

```java
public record RegisterRequest(
    @NotBlank @Size(max = 100) String name,
    @NotBlank @Email @Size(max = 255) String email,
    @NotBlank @Size(min = 8, max = 72) String password
) {}
```

The exact password policy can be strengthened, but must be documented and consistently enforced.

### Dish controller

- `GET /api/dishes`
- `GET /api/dishes?available=true`
- `GET /api/dishes/{id}`

Return a `DishResponse` with ID, name, description, price, image URL, category, and availability. Do not expose persistence internals.

### Student order controller

- `POST /api/orders`
- `GET /api/orders/my`
- `GET /api/orders/{id}`
- `PATCH /api/orders/{id}/cancel`

Example request:

```json
{
  "paymentMethod": "CASH",
  "items": [
    { "dishId": 1, "quantity": 2 },
    { "dishId": 4, "quantity": 1 }
  ]
}
```

Do not accept `userId`, `totalAmount`, item price, or order status from the client. Derive the current user from Spring Security and calculate all monetary values on the server.

### Staff controller

- `GET /api/staff/orders?status=PLACED`
- `GET /api/staff/orders/active`
- `GET /api/staff/orders/history`
- `PATCH /api/staff/orders/{id}/status`
- `PATCH /api/staff/orders/{id}/payment`
- `PATCH /api/staff/dishes/{id}/availability`

Example status request:

```json
{
  "status": "PREPARING"
}
```

Example availability request:

```json
{
  "available": false
}
```

Example payment request:

```json
{
  "paymentStatus": "PAID"
}
```

Only staff may call staff endpoints. The payment endpoint must be used only after cash has physically been collected.

### HTTP response conventions

- `200 OK`: successful read or update.
- `201 Created`: order created; include order ID and token.
- `204 No Content`: successful logout if that convention is chosen.
- `400 Bad Request`: invalid input or invalid state transition.
- `401 Unauthorized`: no valid authentication.
- `403 Forbidden`: authenticated user lacks permission.
- `404 Not Found`: resource does not exist or is not visible to that caller.
- `409 Conflict`: duplicate email/token or concurrent conflicting update.
- `500 Internal Server Error`: unexpected failure, with no stack trace sent to the client.

Use a consistent error body, for example:

```json
{
  "code": "DISH_UNAVAILABLE",
  "message": "One or more selected dishes are currently unavailable."
}
```

Do not reveal whether a private resource belongs to another user if that would leak information.

## 8. Order creation service

Implement order creation as a single transactional service operation.

Suggested flow:
1. Get the authenticated user from the security context; do not take the user ID from the request.
2. Validate that the request has at least one item.
3. Validate each quantity is within a reasonable configured limit.
4. Load all requested dishes from MySQL.
5. Reject missing or unavailable dishes.
6. Read current prices from the database; ignore any client-supplied price or total.
7. Calculate each line subtotal and the total using `BigDecimal`.
8. Create the order with `PLACED`, `CASH`, and `UNPAID`.
9. Generate a unique token using a collision-safe mechanism (for example, a database-backed sequence plus a readable prefix); do not use a non-atomic row count.
10. Save the order and item snapshots in the same transaction.
11. After commit, publish a new-order event to the staff queue.
12. Return an order response containing the token, status, items, total, and payment information.

If any validation fails, roll back the entire transaction. Prevent duplicate submissions where practical, for example with an idempotency key if the UI/network behaviour requires it.

## 9. Order status and business rules

Allowed normal progression:

`PLACED → ACCEPTED → PREPARING → READY → COMPLETED`

Cancellation is allowed only from `PLACED` or `ACCEPTED` in the initial version. Reject attempts to skip stages, reverse a completed order, or update a cancelled order. Centralise transition validation in an `OrderService`; do not repeat status rules across controllers.

Use a method such as `transitionTo(order, requestedStatus)` that checks the current status and requested next status. Update `updatedAt` on every successful change. After the transaction commits, publish the status update event.

If the college later decides to permit staff cancellation or different transitions, update this document, `implementation.md`, tests, and frontend together.

## 10. Cash payment rules

- Every order uses `PaymentMethod.CASH`.
- New orders start with `PaymentStatus.UNPAID`.
- Staff may mark payment as `PAID` only after receiving cash.
- Do not integrate a payment gateway or simulate online payment.
- Payment status is separate from preparation status: an order may be READY while payment is still UNPAID.
- If the college needs a rule that an order cannot be completed until paid, enforce that in the service and document it explicitly before implementing.

## 11. Real-time updates with WebSocket/STOMP

REST remains the source of truth. WebSocket is for notifying connected clients that data changed.

Suggested destinations:
- `/topic/staff/orders` — newly placed orders; STAFF subscribers only.
- `/topic/orders/{orderId}` — order status updates; owner and STAFF only.
- `/topic/dishes` — dish availability changes; authenticated users as appropriate.

Events should be created by the backend after successful database commits. Clients must not be allowed to publish authoritative order, payment, or availability updates to these destinations.

Example event payload:

```json
{
  "type": "ORDER_STATUS_UPDATED",
  "orderId": 123,
  "tokenNumber": "C123",
  "status": "READY",
  "updatedAt": "2026-10-24T10:15:00Z"
}
```

The timestamp is illustrative; generate it on the server. Authenticate WebSocket connections and authorise subscriptions so students cannot listen to other students' private order updates. On reconnect, the frontend must fetch current data via REST because WebSocket events may have been missed.

Use a transactional event pattern or publish after transaction completion so the client is not notified of a database change that later rolls back.

## 12. Repositories and query methods

Create Spring Data JPA repositories such as:
- `UserRepository`: find by normalised email, check email existence.
- `DishRepository`: find available dishes, find all dishes by category if needed.
- `FoodOrderRepository`: find orders by user, find by status ordered by creation time, find order with items.
- `OrderItemRepository`: usually accessed through the order aggregate; add queries only when needed.

Avoid N+1 query problems. Use explicit fetch joins, entity graphs, or DTO projections for staff queue and order detail responses. Do not serialize lazy-loaded entity graphs directly.

## 13. Validation and exception handling

Use Jakarta Bean Validation on request DTOs:
- Nonblank name and email.
- Valid email format.
- Password length/policy.
- At least one order item.
- Positive quantities and maximum quantity limits.
- Non-null supported payment method.
- Non-null status/availability fields.

Use a `@RestControllerAdvice` handler to map validation and business exceptions to stable error codes. Log technical details on the server, but do not return stack traces, SQL, secrets, or password data.

## 14. Testing plan

Write tests before considering the backend complete.

### Unit tests
- Total and subtotal calculations use `BigDecimal`.
- Invalid status transitions are rejected.
- Cancellation is allowed only in permitted states.
- Token generation is unique under concurrent requests where practical.

### Integration tests
- Registration creates STUDENT accounts only.
- Passwords are stored hashed.
- Duplicate email is rejected.
- Student can place a valid cash order.
- Unavailable dish prevents order creation.
- Server ignores client-supplied prices and totals.
- Invalid order rolls back without partial rows.
- Student A cannot view/cancel Student B's order.
- Student cannot call staff APIs.
- Staff can toggle availability and update valid order statuses.
- Cash payment cannot be marked by a student.
- WebSocket subscription authorisation prevents cross-user data access.

Use a separate test database or Testcontainers; never run tests against production data.

## 15. Build phases

### Phase 1 — Project setup
- Create Spring Boot Maven project and dependencies.
- Configure MySQL via environment variables.
- Add migration tool and initial schema.
- Add health/startup verification.

**Done when:** backend starts and connects to the local database.

### Phase 2 — Entities and menu
- Implement enums, entities, repositories, and seed data.
- Implement dish DTOs and `GET /api/dishes` endpoints.

**Done when:** menu data is returned from MySQL.

### Phase 3 — Authentication/security
- Configure Spring Security, BCrypt, session login/logout, current-user endpoint, and CSRF/CORS.
- Add student registration and controlled staff provisioning.
- Add role checks.

**Done when:** public registration cannot create staff and unauthorised requests are blocked.

### Phase 4 — Orders
- Implement order DTOs, service, repositories, transactional creation, tokens, history, ownership checks, and cancellation.
- Implement central status transition rules.

**Done when:** order scenarios and security tests pass.

### Phase 5 — Staff features
- Implement queue filters, status updates, availability toggles, and cash payment confirmation.

**Done when:** staff workflows persist correctly and students cannot use staff endpoints.

### Phase 6 — Real-time
- Add STOMP configuration, authenticated subscriptions, and backend event publisher.
- Publish events after commit.

**Done when:** staff sees new orders and students see their own status changes without refreshing.

### Phase 7 — Hardening and documentation
- Add validation/error handling, integration tests, environment documentation, seed instructions, and API examples.
- Run a clean build and test suite.

**Done when:** another developer can configure and run the backend using the documented steps.

## 16. Instructions for the coding agent

1. Read `implementation.md`, `ui.md`, and this `backend.md` before coding.
2. Inspect the existing repository and retain useful working code.
3. Implement in the phases above; avoid generating the entire backend as one untested block.
4. Keep controllers thin and put business rules in services.
5. Use request/response DTOs; do not expose JPA entities directly.
6. Enforce security at the backend, not only in React.
7. Do not hardcode secrets, college domain, production URLs, or credentials.
8. Do not add an admin role, online payment, quantity inventory, or unapproved features.
9. Run Maven tests and build after each phase; fix failures before continuing.
10. At completion, report endpoints implemented, migrations, environment variables, test results, run commands, and known gaps.

## 17. Definition of done

- Java Spring Boot application starts cleanly.
- MySQL schema and fixed menu data are available.
- Student and staff access rules are enforced.
- Passwords are hashed and sessions are handled securely.
- Orders and order items are persisted transactionally.
- Totals and tokens are calculated/generated by the server.
- Cash payment starts unpaid and can be marked paid by staff after collection.
- Status transitions and cancellation rules are enforced.
- Dish availability changes persist and update clients in real time.
- Students cannot read another student's private order.
- API errors are consistent and do not leak sensitive internals.
- Automated tests cover core workflows and access control.
