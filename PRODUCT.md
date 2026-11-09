# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Staff and an admin/owner at one business. Staff record stock movements (stock-in, stock-out, adjustment) and sales during shifts; the admin manages products, categories, suppliers, and user accounts. Users must activate their account through a signed link before they can sign in.

## Product Purpose

Aircare is an inventory and sales management tool for a single retail business: keep stock levels, movements, and sales accurate in one place instead of scattered records. The project itself exists as a learning/portfolio piece demonstrating React, Inertia, and Laravel skills. Success means correct, well-architected features on a realistic retail domain — service classes, database transactions, dependency injection, policies, and clean Inertia forms working end to end.

## Positioning

Its credibility comes from demonstrated craft on realistic workflows: full-stack Laravel patterns (service layer, DB transactions, policies, Fortify auth) paired with an Inertia React UI handling the daily loop of catalog → stock movements → sales. No marketing claim exists for it; the artifact and its code are the argument.

## Operating Context

- Served by Laravel Herd at `aircare.test`; dev runs via `composer dev` (artisan serve, queue listener, Vite).
- Auth is Laravel Fortify with signed account activation emails and an `active` user-status gate; the `admin` role gates user management.
- Daily workflows: manage catalog (products with SKU, image, unit price, reorder level; categories; suppliers with status toggling), record stock-in/stock-out/adjustment movements against inventory, browse movement history, create sales (with void), and view a dashboard of stock and sales state.
- Seeded demo data exists (users, categories, suppliers, products, inventory, sales) under `database/seeders` for a realistic working dataset.

## Capabilities and Constraints

- Stack: Laravel 13 (PHP 8.3+) + Inertia v3 + React 19 + Tailwind v4, Fortify auth, Pest tests, Pint formatting.
- Terminology (keep consistent): Product, Category, Supplier, Inventory, Inventory Movement (stock-in, stock-out, adjustment), Sale (with statuses incl. void), Stock Status (derived from quantity vs. reorder level), SKU.
- Roles: `admin` vs staff; user statuses (pending/active) and product/sale/movement enums live in `app/Enums`.
- Products support soft deletes and an image on the public disk; stock status is derived, never stored.
- Authorization via policies for categories, products, sales, and suppliers.
- Undecided: no deployment target, no second-tenant/multi-business requirement, no defined audience beyond the single-business workflow.

## Brand Commitments

"Aircare" is a project label only — no logo, voice, or brand assets exist and none are binding. (Confirmed: treat rebranding as always permissible.)

## Evidence on Hand

- The working application itself (code, routes, pages, seeders with demo images under `database/seeders/images`).
- `README.md` is a study outline (React, Inertia, Laravel, GitHub topics), not product or marketing copy.
- No marketing content, testimonials, customers, case studies, benchmarks, or pricing exist. Future work must not fabricate any of them.

## Product Principles

1. Correctness is the product: stock and sales numbers must stay accurate through transactions, not optimistic UI.
2. Architecture demonstrates craft: business logic lives in services, access is enforced by policies, and controllers stay thin.
3. Fit the real daily workflow: the catalog → movement → sale loop stays fast to scan and hard to misuse.
4. Honest by default: no invented claims, customers, or brand story anywhere in the interface.
