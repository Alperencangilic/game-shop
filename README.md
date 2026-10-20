# Game Shop – Digital Game Purchase Management System

CENG 475 term project (Project 5). Game Shop is a web store for digital games. Customers browse the catalog,
buy games with a demo wallet and download them immediately; store managers and administrators manage the
catalog, prices, stock, promotions, orders, user accounts and sales reports.

**Team**

| Student number | Name |
|----------------|------|
| ……………… | ……………… |
| ……………… | ……………… |
| ……………… | ……………… |

---

## 1. How to run

Requirements: **Node.js 18 or newer** (tested with Node 22) and npm. Present the project in **Chrome or Edge**.

```bash
# 1. Install the packages of both parts (only the first time)
npm run setup

# 2. Start the API and the React app together
npm run dev
```

Open **http://localhost:5173**. On the first start the API creates the SQLite database
(`server/data/store.db`) and fills it with demo data: 26 real games (facts and images from the Steam store), 16 game codes / gift cards (Valorant VP, LoL RP, PUBG Mobile UC, Fortnite V-Bucks, CS2 Prime, Steam Wallet...), 24 users and ~80 orders. Images are loaded from the internet (Steam / Wikimedia); offline a gray box with the name is shown.

| Command            | What it does                                                                  |
|--------------------|-------------------------------------------------------------------------------|
| `npm run setup`    | `npm install` in `server/` and `client/`                                      |
| `npm run dev`      | API on port 4000 + React dev server on port 5173 (Ctrl+C stops both)          |
| `npm start`        | Builds the React app and serves everything from **http://localhost:4000**     |
| `npm run reset-db` | Deletes the database (stop the server first); the next start re-creates it   |

The two parts can also be started separately: `cd server && npm run dev` and `cd client && npm run dev`.

### Demo accounts

The sign-in page has buttons that fill these in.

| Role          | Email                        | Password      | Shows                                    |
|---------------|------------------------------|---------------|------------------------------------------|
| Customer      | customer@gameshop.local    | customer123   | shopping, library, wallet, reviews       |
| Store manager | manager@gameshop.local     | manager123    | back office without users/logs/refunds   |
| Administrator | admin@gameshop.local       | admin123      | everything                               |
| Suspended     | suspended@gameshop.local   | customer123   | the "account suspended" warning          |

All generated customers (e.g. `elif.demir@example.com`) also use `customer123`.
New accounts created on the sign-up page get $50 of demo wallet credit.

---

## 2. What the project covers (evaluation form)

| # | Criterion | Where to look |
|---|-----------|---------------|
| 1 | HTML, CSS, React and vanilla JavaScript | 60+ React components; one hand-written CSS file (`client/src/index.css`); vanilla JS modules listed in section 6 |
| 2 | Working solution to the topic | Catalog with prices, genres and system requirements · purchase + instant download · real-time inventory · accounts with download history and recommendations · admin panel with games, prices, promotions and best-seller reports |
| 3 | Sign up / sign in, security | bcrypt password hashing, JWT in an httpOnly cookie, rate-limited login, suspended accounts, password strength meter, Caps Lock warning (section 7) |
| 4 | Warning mechanisms | toasts, confirmation dialogs (some require typing DELETE), inline form errors, "why can't I?" buttons, unsaved-changes guard, offline/server banner, low-stock and price-change warnings (section 5) |
| 5 | Database and CRUD | 13 SQLite tables with foreign keys, CHECK and UNIQUE constraints and transactions; SELECT / INSERT / UPDATE / DELETE from many pages; a **live SQL log** in the back office shows every statement (section 4) |
| 6 | Roles and authorization | Guest, Customer, Store manager, Administrator with different permissions, enforced by the server on every request (section 3) |
| 7 | Components, props, state | components split into `components/common`, `layout`, `store`, `admin`, `charts`; contexts for auth, toasts, dialogs, live updates and the cart |
| 8 | Documentation and code quality | this README, comments at the top of every file explaining its job |
| 9 | User friendliness | search with `/` shortcut, filters kept in the URL, skeleton loading, empty states with next steps, keyboard-accessible dialogs and tabs, responsive layout, print-friendly receipts and reports |

---

## 3. Roles

| Can …                                        | Guest | Customer | Store manager | Administrator |
|----------------------------------------------|:-----:|:--------:|:-------------:|:-------------:|
| Browse the catalog, read reviews             | ✓ | ✓ | ✓ | ✓ |
| Cart, wishlist, buy, download, write reviews |   | ✓ |   |   |
| Wallet, order history, download history      |   | ✓ |   |   |
| Add/edit/hide/delete games, prices, stock    |   |   | ✓ | ✓ |
| Create/end/delete promotions                 |   |   | ✓ | ✓ |
| See all orders and sales reports             |   |   | ✓ | ✓ |
| Remove any review (moderation)               |   |   | ✓ | ✓ |
| Refund orders                                |   |   |   | ✓ |
| Manage users (create, change role, suspend, delete) |   |   |   | ✓ |
| Audit log and live SQL log                   |   |   |   | ✓ |

- Permissions live in `server/src/permissions.js`. Every protected API route calls `requirePermission(...)`;
  the user's role is read from the database on each request, so a role change or suspension works immediately.
- The client hides what a role cannot do, and when a user still reaches it (e.g. a manager opens
  `/admin/users`) it explains why instead of failing silently. Locked back-office sections show a lock and
  a tooltip with the reason.
- Public sign-up always creates a customer. Staff accounts are created by an administrator.
- Safety rules: an admin cannot change their own role, suspend or delete themselves, and the last active
  administrator cannot be demoted, suspended or deleted.

---

**Product types:** `game` (installable, bought once, has system requirements) and `epin` (code for in-game currency or a gift card, can be bought again).

## 4. Database

SQLite (file `server/data/store.db`) through `better-sqlite3`. The schema is in `server/src/db.js`,
demo data in `server/src/seed.js`.

| Table                 | Stores                                                   |
|-----------------------|----------------------------------------------------------|
| `users`               | accounts, role, status, wallet balance                   |
| `games`               | catalog: price, stock (license keys), requirements       |
| `promotions`          | discounts for the store, a genre or one game, with dates |
| `cart_items`          | each customer's cart                                     |
| `wishlist`            | wishlisted games                                         |
| `orders`, `order_items` | purchases and the price paid for each game             |
| `library`             | owned games with their license keys                      |
| `downloads`           | download history                                         |
| `reviews`             | one rating + comment per customer and game               |
| `wallet_transactions` | top-ups, purchases and refunds                           |
| `notifications`       | messages to a user (sale on a wishlisted game, refund…)  |
| `audit_log`           | who changed what in the back office                      |

**Integrity:** foreign keys (`ON DELETE CASCADE / RESTRICT / SET NULL`), `CHECK` constraints (price ≥ 0,
stock ≥ 0, rating 1–5, discount 1–90 %, recommended specs ≥ minimum…), `UNIQUE` constraints (email, game
title, one review per game). Checkout and refunds run inside **transactions**: if anything fails (sold out,
not enough balance) nothing is written. A sold game cannot be deleted (only hidden) and a user with orders
cannot be deleted (only suspended), so reports stay correct.

**CRUD examples in the interface**

| Operation | Examples |
|-----------|----------|
| SELECT | catalog and filters, game page, library, orders, reports, dashboard |
| INSERT | sign up, add to cart / wishlist, checkout, write review, add game, create promotion, add user, top up wallet |
| UPDATE | change price/stock inline, bulk price change, edit game, end promotion, change role, suspend user, edit review, refund, edit profile/password |
| DELETE | remove from cart, empty cart, remove review, delete game/promotion/user, clear download history, delete notifications, delete own account |

To show the queries during the presentation, open **Back office → Activity & SQL** as the administrator and
use the store in another window: each action's SQL appears within a second (values are hidden).

---

## 5. Warnings and feedback

- **Toasts** for every result (success, info, warning, error), with an action button where useful
  ("View cart") and a timer bar that pauses on hover.
- **Confirmation dialogs** before purchases (balance before/after), refunds, deletions, role changes,
  suspensions and price changes. Irreversible deletions require typing `DELETE`.
- **"Why not?" buttons**: unavailable actions stay clickable and explain the reason, e.g. "Sold out – add it
  to your wishlist", "Staff accounts can't buy games", "Only administrators can refund orders",
  "This user has 4 orders – suspend instead".
- **Inline validation** on every form, password strength meter, Caps Lock warning.
- **Context warnings**: low stock, sold out, not enough wallet balance, "prices changed while you were
  shopping" (the server compares the total the customer saw),
  overlapping promotions, very large discounts, hidden games.
- **Unsaved changes**: closing a changed form asks first; leaving the tab triggers the browser warning.
- **Connection**: a banner appears when the browser is offline or the server cannot be reached; the dot in
  the top bar shows the live-update status.
- **Session**: when the session expires or an admin suspends the account, the user is signed out with a message.

---

## 6. React and vanilla JavaScript

**React** (`client/src`): function components with props and state, React Router (nested routes, URL
search params for filters and tabs), Context API (`AuthContext`, `ToastContext`, `ConfirmContext`,
`LiveContext`, `ShopContext`), custom hooks (`useApi`, `useCheckout`, `useGamesFeed`, `useCountdown`,
`useDebounce`, `useMeta`, `useBrowser`), portals for dialogs, `memo`/`useMemo` where lists are large.

**Vanilla JavaScript** (no libraries):

| File | What it does |
|------|--------------|
| `components/admin/LineChart.jsx`, `BarChart.jsx` | simple SVG / div charts |
| `utils/csv.js` | builds CSV files and downloads them with `Blob` |
| `utils/validators.js` | form rules and the password strength score |
| `utils/storage.js` | localStorage helpers (recently viewed games) |
| `api.js` | `fetch` wrapper; streamed download with progress (`ReadableStream`) |
| `LiveContext.jsx` | `EventSource` (Server-Sent Events) for real-time stock and prices |
| other | `requestAnimationFrame` download bar, Clipboard API for license keys, `KeyboardEvent.getModifierState` for Caps Lock, keyboard shortcuts, `beforeunload` guard, `window.print()` receipts |

**Real-time inventory:** the server pushes an event over Server-Sent Events whenever stock or prices change.
Every open store page updates the "keys left" meter (it flashes) without a refresh. Try it with two
browser windows: buy the last copies in one and watch the other.

---

## 7. Security

- Passwords hashed with **bcrypt** (cost 12); never returned by the API.
- Session: **JWT in an httpOnly, SameSite=Lax cookie** (JavaScript cannot read it), valid for 2 hours.
- Login/sign-up **rate limited** (30 attempts / 15 min / IP); the login error does not reveal whether an
  email exists.
- Every query is **parameterized**; dynamic column names come from whitelists.
- **helmet** security headers and a Content-Security-Policy; JSON bodies limited to 20 KB.
- The server validates all input again (`server/src/validation.js`), the client checks only for convenience.
- Payments are simulated with a demo wallet; no card data is ever requested.

---

## 8. Project structure

```
package.json            root scripts (setup, dev, start, reset-db)
scripts/dev.js          starts API + React dev server together
server/
  src/index.js          Express app, routes, error handling, serves the built app
  src/db.js             SQLite connection, schema, SQL logging wrapper
  src/seed.js           demo data
  src/permissions.js    roles and permissions
  src/games.js          shared game query (best promotion, sales, rating, owned flags)
  src/events.js         Server-Sent Events
  src/activity.js       audit log + notifications
  src/validation.js     input validation
  src/middleware/auth.js  session cookie, requireUser, requirePermission
  src/routes/           auth, games (catalog, reviews, download), shop (cart, wishlist,
                        checkout, orders), library, account, admin/* (games, promotions,
                        orders, users, reports, logs)
client/
  src/main.jsx          providers; App.jsx: routes and guards
  src/context/          auth, toasts, confirm dialogs, live updates, shop state
  src/hooks/            reusable hooks
  src/components/       common/ layout/ store/ admin/ charts/
  src/pages/            Store, GameDetail, Cart, Library, Downloads, Orders, Wishlist,
                        Account, Login, Register, admin/*
  src/styles/           base, layout, components, store, admin, print
```

---

## 9. Suggested presentation flow (≈10 minutes)

1. **Guest:** store page – spotlight, filters (genre + "On sale"), search with `/`. Click *Add to cart* → asked to sign in.
2. **Sign up** a new account (show the inline errors and the strength meter first).
3. **Customer** (`customer@gameshop.local`): game page → *System requirements* → *Buy now* → confirmation → order complete → *Download*. Then Library (license key), Download history, Wallet.
4. Add an expensive game to the cart → "Not enough balance" warning → top up → checkout.
5. **Second window as admin:** Dashboard updates live; Activity & SQL shows the INSERT/UPDATE/DELETE statements of the purchase.
6. **Admin:** change a price inline, restock a sold-out game (wishlisting customers get a notification), create a promotion, try to delete a sold game (blocked → hide instead), refund an order, open Reports and export CSV.
7. **Manager:** locked sections and the "only administrators" messages. **Suspended account:** sign-in blocked with a message.

---

## 10. Troubleshooting

- **"Port 4000 is already in use"** – another copy of the server is running. Close it, or start with `PORT=4001` (then change the proxy in `client/vite.config.js`).
- **`better-sqlite3` install error** – use an LTS version of Node.js (18, 20 or 22) so a prebuilt binary is downloaded.
- **Start from clean demo data** – stop the server, run `npm run reset-db`, start again.
- **No internet during the presentation** – everything works offline; only the Google Fonts fall back to system fonts.
