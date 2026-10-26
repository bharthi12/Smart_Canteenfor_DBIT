# Smart Canteen UI Design Specification

> This document defines the visual design and frontend behaviour for Smart Canteen. It complements `implementation.md`; it does not replace or change its architecture, database, API contract, authentication rules, roles, payment method, or order workflow.

## 1. Design direction

Use the uploaded pizza website references as visual inspiration: bold editorial typography, deep forest-green backgrounds, warm cream surfaces, vivid tomato-orange actions, golden-yellow highlights, playful food illustrations, rounded cards, and confident diagonal or organic decorative shapes.

Adapt this visual language to a college canteen ordering product. Keep the interface lively and memorable without making order status, availability, prices, or staff queue information hard to read.

### Principles
- Bold but usable: strong headlines, readable body text.
- Food-forward: use dish photos or illustrations when available.
- High contrast and accessible focus states.
- Responsive: mobile student ordering and desktop/tablet staff management.
- Consistent buttons, badges, spacing, and card styles.
- Never let decoration obscure text, prices, controls, or order status.

## 2. Colour palette

Use these CSS variables throughout the frontend:

```css
:root {
  --color-forest: #00552F;
  --color-forest-deep: #003F25;
  --color-forest-soft: #176B43;
  --color-tomato: #F04B16;
  --color-tomato-hover: #D93E0D;
  --color-gold: #F8B91D;
  --color-yellow: #FFD86B;
  --color-cream: #F7E8C8;
  --color-cream-light: #FFF8EA;
  --color-white: #FFFFFF;
  --color-ink: #171714;
  --color-muted: #5D625B;
  --color-border: #D8D2C4;
  --color-success: #176B43;
  --color-warning: #8B5A00;
  --color-danger: #B42318;
  --shadow-card: 0 8px 24px rgba(0, 35, 19, 0.12);
  --radius-card: 20px;
  --radius-control: 999px;
}
```

| Colour | Use |
|---|---|
| Forest green | Brand, header, hero, footer, staff navigation |
| Deep forest | Dark backgrounds and hover states |
| Tomato orange | Primary actions: Add to cart, Place order |
| Gold/yellow | Prices, selected category, small highlights |
| Warm cream | Page background and panels |
| White | Dish cards and input surfaces |
| Ink | Main text on light surfaces |
| Muted | Supporting text |
| Semantic status colours | Status indicators, always paired with text/icon |

Avoid small yellow text on cream or orange text on green. Do not use colour alone to convey availability or order status.

## 3. Typography

Use **Helvetica Neue** if available; otherwise use a system sans-serif stack. Do not depend on a font download that is not configured.

```css
:root {
  --font-body: "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-display: "Helvetica Neue", Helvetica, Arial, sans-serif;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --heading-sm: 1.5rem;
  --heading-md: clamp(1.8rem, 3vw, 2.5rem);
  --heading-lg: clamp(2.4rem, 6vw, 4.5rem);
}
```

Use bold display text for hero and section headings, semibold labels for prices/buttons, and body line-height around 1.5. Reserve uppercase for short labels, not long paragraphs.

## 4. Layout and visual language

- Center content in a container with max width around 1280px.
- Use a 4px/8px spacing scale.
- Use 16–24px rounded cards, pill-shaped primary buttons, and soft shadows.
- Add decorative waves, angled colour bands, food doodles, or sticker-like badges sparingly.
- Keep content grids aligned and prevent decoration from overlapping interactive elements.
- Use subtle borders on cream cards.

Suggested spacing tokens: 4, 8, 12, 16, 24, 32, 48, and 64px.

## 5. Shared application shell

### Header
- Forest-green header with a compact canteen wordmark or text logo.
- Student navigation: **Menu**, **My Orders**, cart indicator.
- Staff navigation: **Order Queue**, **Menu Availability**.
- Provide logout and show user identity only when useful.
- Collapse navigation accessibly on mobile.
- Do not add an admin area; the project has no admin role.

### Footer
Use a simple deep-green footer with configured canteen/college details only. Do not invent a college name, address, hours, or contact details.

## 6. Page specifications

### Login — `/login`
- Forest-green background or split green/cream layout.
- Cream panel with a “Welcome back” heading.
- College email and password fields.
- Tomato primary button: **Log in**.
- Student registration link.
- Inline validation and clear error messages.
- No role selector: role comes from authenticated backend identity.

### Registration — `/register`
- Cream/white card on green background.
- Name, college email, password, confirm password.
- Button: **Create student account**.
- Explain that public registration creates STUDENT accounts only.
- No staff registration or role dropdown.
- Keep college email domain configurable; use the verification approach specified in `implementation.md`.

### Menu — `/menu`
Primary student landing page.

- Optional compact green hero with a bold headline such as “Your next campus favourite.” Keep menu access close to the top.
- Category chips should be generated from actual menu categories.
- Search by dish name and optional “Available only” filter.
- Dish cards include image, name, description, price, availability label, and add/quantity control.
- Use cream/white cards, dark text, and a small gold price accent.
- Sold-out dishes must visibly say **Sold out** and have a disabled add action.
- Render actual API data. Do not invent dishes, prices, discounts, ratings, or stock counts.
- Show cart count in navigation. A mobile sticky cart summary is optional but must not obscure content.

### Cart — `/cart`
- List items, quantities, unit prices, and subtotals.
- Emphasize the total.
- Payment method is **Cash at the counter**.
- Do not show online payment, card, UPI, gateway, or fake payment-success UI.
- Primary action: **Place order**.
- Explain that cash is paid at the counter.
- Include an empty-cart state and prevent duplicate submissions.
- Backend revalidates price and availability at submission.

### Order tracking — `/orders/:id`
- Prominent unique order token.
- Show items, quantities, total, cash payment method, and payment status.
- Progress tracker: Placed → Accepted → Preparing → Ready → Completed.
- Show cancellation only when permitted by backend rules.
- Use WebSocket events as specified in `implementation.md`.
- If disconnected, show a small reconnecting message and fetch latest state from REST.
- Always show status text; never rely on colour alone.

### My Orders — `/orders`
- Separate active and past orders.
- Show token, date/time, total, payment status, and order status.
- Link to order tracking.
- Include loading, error, and empty states.
- Display only the authenticated student's own orders.

### Staff dashboard — `/staff`
Optimise for a canteen laptop/tablet, with responsive mobile fallback.

**Live order queue**
- Clear heading such as “Live order queue”.
- Filter/group by Placed, Accepted, Preparing, Ready.
- Sort oldest first unless business requirements change.
- Each order card shows token, time placed, items, quantities, total, and payment status.
- Use large, easy-to-tap actions: Accept, Start preparing, Mark ready, Complete.
- Indicate new orders without flashing or distracting animations.

**Menu availability**
- List fixed menu items with explicit Available/Sold out labels and a toggle/button.
- Show clear success/error feedback.
- Persist changes through the existing staff API and broadcast through the existing WebSocket design.
- Mark cash paid only after physically collecting it.

**Dashboard states**
- Empty: “No active orders right now.”
- Connection loss: non-blocking reconnect indicator and REST refresh.
- API failure: actionable retry message, not a blank screen.

## 7. Reusable components

Build reusable components rather than repeating styles:
- `Navbar`
- `Button` (primary, secondary, outline, danger)
- `DishCard`
- `CategoryChip`
- `AvailabilityBadge`
- `CartItem`
- `OrderStatus`
- `OrderProgress`
- `OrderCard`
- `StaffOrderCard`
- `LoadingState`
- `EmptyState`
- `ErrorMessage`
- `ProtectedRoute`
- `FormField`
- `ConfirmDialog` where needed

Use semantic forms/buttons, keyboard support, visible focus states, and real disabled states.

## 8. Interaction rules

- Primary CTA: tomato orange with readable white text.
- Secondary CTA: cream/transparent surface with green border and text.
- Hover/focus states must be visible; never remove keyboard focus outlines without replacement.
- Disable repeat submission while requests are in progress.
- Display errors near the relevant field/action.
- Show concise confirmation for successful actions.
- Frontend state is not authoritative for orders, prices, or availability; backend APIs persist all changes.
- Update UI from real-time events and refetch after reconnect.

## 9. Responsive behaviour

- **Mobile (<640px):** one-column menu, compact header, full-width primary actions, touch-friendly controls.
- **Tablet (640–1024px):** two-column dish grid where appropriate; staff dashboard may stack sections.
- **Desktop (>1024px):** three/four menu columns based on card width; staff dashboard can show queue and availability side by side.
- Avoid horizontal scrolling. Ensure dialogs fit in the viewport.

## 10. Accessibility and quality

- Aim for WCAG AA contrast.
- Use semantic heading hierarchy, labels, meaningful image alt text, and ARIA only when needed.
- All controls work with keyboard alone.
- Pair status colours with text/icons.
- Respect reduced-motion preferences; do not flash new-order indicators.
- Provide readable focus states and accessible announcements for important order updates.

## 11. Suggested CSS organisation

```text
frontend/src/styles/
├── tokens.css       # palette, typography, spacing, radii, shadows
├── global.css       # reset, body, base elements
├── layout.css       # container, grid, responsive utilities
└── components.css   # buttons, cards, badges, forms
```

Import design tokens once from the app entry point. Prefer CSS variables and reusable classes over duplicated inline styles.

## 12. Alignment with `implementation.md`

The following functional and technical decisions remain fixed:

- Stack remains React + Vite, Java Spring Boot, and MySQL.
- Exactly two roles: STUDENT and STAFF. No admin role.
- Menu items/prices are fixed/configured; staff only toggles availability in this version.
- Stock is a boolean availability state, not quantity inventory.
- Payment is cash at the counter; no payment gateway in this version.
- Real-time updates use Spring WebSocket/STOMP; REST remains the source of truth.
- API endpoints, authentication, ownership checks, and status transitions remain those in `implementation.md`.
- Do not add coupons, discounts, ratings, delivery tracking, online payments, or analytics without approval.
- Any extra feature must be documented separately and approved before implementation.

## 13. Instructions for the coding agent

1. Read `implementation.md` and `ui.md` before implementing UI.
2. `implementation.md` is authoritative for architecture, APIs, database, security, and business rules.
3. `ui.md` is authoritative for visual design, layouts, components, responsive behaviour, and styling.
4. If there is a conflict, preserve `implementation.md` for functional/technical behaviour; do not silently alter APIs or requirements.
5. Inspect existing code before modifying files.
6. Implement in stages: design tokens and shell, authentication, menu/cart, student tracking, staff dashboard.
7. Use real API data once endpoints are available; don't leave hardcoded mock data in integrated screens.
8. Test mobile, tablet, desktop, and keyboard accessibility.
9. At completion, list screens implemented, files changed, checks performed, and remaining gaps.
