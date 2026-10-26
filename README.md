# Smart Canteen Management & Ordering System

A full-stack college canteen ordering and kitchen queue management application built with **Spring Boot 3 (Java 21+)**, **MySQL 8.0**, and **React 18 + Vite**, featuring real-time **STOMP WebSocket** event streaming.

---

## 1. System Overview

### Roles
- **STUDENT**:
  - Verified college-email registration & session login.
  - Browse fixed menu categorized into Breakfast, Meals, North Indian, Snacks, Beverages, and Desserts.
  - Live availability status (`Available` / `Sold Out`).
  - Search dish by name and filter by availability.
  - Cart with item quantity controls (clamped between 1 and 20).
  - Place cash-at-counter orders and receive collision-safe tokens (e.g. `C-261025-795`).
  - Live order tracking screen with progress tracker: `Placed → Accepted → Preparing → Ready → Completed`.
  - View order history (Active vs Past orders).
  - Cancel eligible orders while status is `PLACED` or `ACCEPTED`.
  - Backend strictly enforces that students cannot view, track, or cancel other students' orders.

- **STAFF**:
  - Pre-provisioned staff credentials (`staff@college.edu` / `staff123`).
  - Live order queue displaying incoming orders sorted **oldest first**.
  - Review items, quantities, subtotal, total, and timestamps.
  - Easy status progression actions: `Accept Order` → `Start Preparing` → `Mark Ready for Pickup` → `Complete & Hand Over`.
  - Cash collection button: `Mark Cash as Paid` after physically receiving cash at the counter.
  - One-click dish availability toggle (`Available` ↔ `Sold Out`) that broadcasts in real-time to all connected student screens.

---

## 2. Technology Stack

- **Backend**: Java 21, Spring Boot 3.3.4, Spring Security 6, Spring Data JPA, Hibernate ORM 6.5, Jakarta Bean Validation, Spring WebSocket (STOMP + SockJS).
- **Database**: MySQL 8.0 (`smart_canteen`), HikariCP connection pool.
- **Frontend**: React 18, Vite 5, React Router 6, Lucide Icons, STOMPjs, SockJS Client.
- **Styling**: Vanilla CSS adhering strictly to `ui.md` design tokens (Forest Green, Warm Cream, Tomato Orange CTA, Gold accents).
- **Build Tools**: Apache Maven 3.9.6 (via `mvnw.cmd`), npm.

---

## 3. Directory Structure

```text
java_proj/
├── database/
│   └── seed-dishes.sql                    # Initial seed data for canteen dishes
├── backend/
│   ├── .env                               # Local database credentials
│   ├── .env.example                       # Environment template
│   ├── pom.xml                            # Maven dependencies & build configuration
│   ├── mvnw & mvnw.cmd                    # Maven wrapper
│   └── src/
│       ├── main/
│       │   ├── java/com/canteen/
│       │   │   ├── SmartCanteenApplication.java
│       │   │   ├── config/                # Security, WebSocket, DataInitializer
│       │   │   ├── controller/            # Auth, Dish, Order, Staff controllers
│       │   │   ├── dto/                   # DTO records for requests and responses
│       │   │   ├── entity/                # User, Dish, FoodOrder, OrderItem entities
│       │   │   ├── enums/                 # Role, OrderStatus, PaymentMethod, PaymentStatus
│       │   │   ├── exception/             # ApiExceptionHandler and custom exceptions
│       │   │   ├── repository/            # Spring Data JPA repositories
│       │   │   ├── security/              # CustomUserDetailsService
│       │   │   ├── service/               # AuthService, DishService, OrderService
│       │   │   └── websocket/             # STOMP EventPublisher and event payloads
│       │   └── resources/
│       │       └── application.properties # Spring configuration
│       └── test/java/com/canteen/service/ # Automated unit and security tests
├── frontend/
│   ├── package.json
│   ├── vite.config.js                     # Proxy configuration for API & WebSockets
│   ├── index.html
│   └── src/
│       ├── components/                    # Navbar, DishCard, CartItem, OrderProgress, etc.
│       ├── context/                       # AuthContext, CartContext
│       ├── pages/                         # Login, Register, Menu, Cart, Orders, Staff
│       ├── services/                      # api, authService, menuService, orderService, socketService
│       ├── styles/                        # tokens.css, global.css, layout.css, components.css
│       ├── App.jsx
│       └── main.jsx
├── implementation.md                      # Specification & architectural guide
├── ui.md                                  # Visual design tokens & styling guide
└── backend.md                             # Backend API & service contract guide
```

---

## 4. Environment Variables & Configuration

In `backend/.env`:

```properties
DB_URL=jdbc:mysql://localhost:3306/smart_canteen?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
DB_USERNAME=root
DB_PASSWORD=bharthi
SERVER_PORT=8080
COLLEGE_EMAIL_DOMAIN=
FRONTEND_ORIGIN=http://localhost:5173
```

---

## 5. How to Run Locally

### 1. Start the Spring Boot Backend
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```
Backend runs on: `http://localhost:8080`

### 2. Start the React Frontend
```powershell
cd frontend
npm install
npm run dev
```
Frontend runs on: `http://localhost:5173`

---

## 6. Default Credentials

| Role | Email | Password |
|---|---|---|
| **Staff** | `staff@college.edu` | `staff123` |
| **Student** | Register any student account via `/register` | (your password) |

---

## 7. Automated Test Suite

Run backend test suite:
```powershell
cd backend
.\mvnw.cmd test
```
All unit tests for business logic, status progression, cancellation permissions, student isolation, and exact `BigDecimal` price calculations pass.
