# RamCool — Inventory & Sales Management System

A full-stack inventory and point-of-sale (POS) web application built for an air conditioning and refrigeration parts business. 

> **Note:** This is my first full-stack application built using **Laravel** and **React** together via **Inertia.js**. Below is an overview of how the app works, how it's structured, and what I learned (including the parts where I got completely stuck!).

---

## 💡 What is RamCool?

RamCool is designed to solve day-to-day retail and inventory tracking challenges for cooling equipment businesses:
- Preventing accidental stock overselling.
- Keeping an unchangeable audit log of every stock movement (deliveries, sales, damages).
- Fast and simple point-of-sale checkout for staff on the floor.
- Clean visual dashboards for business owners to monitor sales trends and low-stock alerts.

---

## 🚀 How It Works

### 1. Point of Sale (POS) & Checkout
- **Interactive Cart:** Search or filter products by category, click to add to cart, and adjust quantities on the fly with live subtotal/total calculations.
- **Stock Depletion & Safety:** Every sale verifies current stock levels before creating the order.
- **Voiding Sales:** If a sale was entered by mistake, admins can void it. The system automatically replenishes the inventory and creates a reversal record.

### 2. Inventory & Movement Tracking
- **Real-Time Stock Status:** Products automatically calculate their status (`In Stock`, `Low Stock`, `Out of Stock`) based on reorder thresholds.
- **Movement Audit Ledger:** Any time stock changes—whether through **Stock In** (new shipments), **Stock Out** (sales/orders), or **Adjustments** (damaged goods, physical inventory counts)—a permanent log entry is recorded with the user who performed it and the reason.

### 3. Product, Category & Supplier Catalog
- Manage products with thumbnail image uploads, descriptions, categories, and unit prices.
- Active/Inactive status toggle prevents discontinued items from being sold while keeping past sales data intact.
- Supplier directory linked to stock tracking.

### 4. Analytics Dashboard
- **Sales Trends:** Visual line charts showing revenue over time.
- **Category Breakdown:** Pie/donut charts showing sales volume across categories (powered by **Recharts**).
- **KPI Metrics:** Immediate glance at total revenue, total orders, low stock items, and top sellers.

### 5. Roles & Account Lifecycle
- **Roles:** Separate permissions for **Admin** and regular **Staff**.
- **Secure Activation:** New staff accounts are created by an admin and activated through cryptographically signed invite links where users set their own passwords.

---

## 🛠️ Tech Stack

- **Backend:** PHP 8.3+, Laravel 12/13, Laravel Fortify (Auth), Pest PHP (Testing)
- **Frontend:** React 19, Inertia.js v3, Tailwind CSS v4, Base UI, Lucide Icons, Recharts, Motion
- **Tooling:** Vite, Laravel Herd, Pint

---

## 🧠 What I Learned & Where I Got Stuck

Building this project was a huge learning curve. Moving from simple scripts to a full-stack, production-style application meant tackling real design patterns and debugging tough edge cases.

### 1. React (The Fundamentals)
* **What I learned:**
  * **Core React:** Breaking UI into small, reusable components rather than monolithic files. Understanding how props pass data down and callbacks pass events up.
  * **Hooks:** Managing local state with `useState`, handling side-effects with `useEffect`, and creating custom hooks (`useFilters`, `useTheme`, `useDebouncedValue`) to keep components clean.
  * **UI State:** Building complex client-side features like the POS cart where item additions, removals, and quantity adjustments immediately reflect in the totals.
* **Where I got stuck / Difficulties:**
  * **State synchronization & prop drilling:** Early on, I tried passing cart state through 4 layers of components before realizing I needed to structure my component tree better.
  * **Re-render loops:** I accidentally triggered infinite re-renders with `useEffect` when filtering product lists until I learned how dependency arrays work.
  * **Controlled vs Uncontrolled inputs:** Syncing custom modal forms and image file pickers with React state was frustrating until I understood how to handle file change events properly.

---

### 2. Inertia.js (Bridging Laravel and React)
* **What I learned:**
  * **The "No API" SPA Experience:** Enjoying the feel of a modern React SPA without having to maintain a separate client-side router or write boilerplate REST API endpoints.
  * **`useForm` Hook:** Handling form submissions, tracking `processing` states to disable buttons, and automatically binding Laravel backend validation errors to input fields.
  * **Flash Messages & Partial Reloads:** Passing server notifications (success/error toasts) directly into Inertia page props.
* **Where I got stuck / Difficulties:**
  * **Preserving state on page visits:** Learning how Inertia reloads page props without losing active tab selections or filter queries (`preserveState: true` and `preserveScroll: true` were lifesavers).
  * **File uploads over Inertia:** Handling `FormData` for product image uploads required using `router.post()` with multipart options, which caused validation errors until the headers and payload were configured properly.

---

### 3. Laravel & PHP (Backend Architecture)
* **What I learned:**
  * **Service Classes & Separation of Concerns:** Moving complex business logic out of controllers into dedicated services (`SaleService`, `InventoryService`, `DashboardService`).
  * **Database Transactions (`DB::transaction`):** Guaranteeing that if a sale item fails or stock runs out midway, the entire transaction rolls back so the database is never left in a corrupted state.
  * **PHP 8 Features & OOP:** Utilizing constructor property promotion, strict parameter typing, and PHP Enums (`ProductStatus`, `SaleStatus`, `MovementType`) to prevent invalid states.
  * **Form Requests & Policies:** Keeping controllers slim by using Form Requests for input validation and Policies for role-based authorization.
  * **Automated Testing:** Writing feature and unit tests with **Pest PHP** to verify critical math, authorization, and inventory movement rules.
* **Where I got stuck / Difficulties:**
  * **Inventory race conditions & atomic updates:** Figuring out how to update inventory quantities safely during checkout while preventing negative stock if two actions happen close together.
  * **Service class dependency injection:** Initially, I didn't know how to pass services into one another through the service container. Learning how Laravel's DI auto-resolves dependencies in constructors was a breakthrough moment.

---

### 4. Git & Developer Workflow
* **What I learned:**
  * **Branching & Pull Requests:** Working in feature branches (`feature/sales-cart`, `feature/inventory-movements`) instead of committing everything straight to `main`.
  * **Git Stashing:** Saving work in progress with `git stash` when needing to quickly fix a bug on another branch without losing uncommitted edits.
  * **Meaningful Commits:** Writing clean, atomic commit messages that explain *why* a change was made, not just *what*.
* **Where I got stuck / Difficulties:**
  * **Merge Conflicts:** Resolving conflicts when frontend components and migration files were updated in different branches.
  * **Untracked files & `.gitignore`:** Accidental commits of build files or temporary files taught me how to properly manage `.gitignore` and `git status`.

---

## 🚀 Getting Started

### Prerequisites
- PHP 8.3+ with Composer
- Node.js (v20+) & npm
- SQLite or MySQL

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd aircare
   ```

2. **Run automated setup:**
   ```bash
   composer run setup
   ```
   *This command installs Composer and NPM dependencies, sets up your `.env`, generates the app key, runs migrations, and builds frontend assets.*

3. **Start the development server:**
   ```bash
   composer run dev
   ```
   *(Runs the Laravel server, queue worker, and Vite dev server simultaneously via Concurrently).*

4. **Run tests:**
   ```bash
   php artisan test
   ```

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
