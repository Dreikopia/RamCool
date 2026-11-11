<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Services\SaleService;
use Illuminate\Database\Seeder;

class SaleSeeder extends Seeder
{
    /**
     * Seed deterministic sales spread across the dashboard chart ranges so the
     * month comparison, trend line and category breakdown all have data.
     *
     * Re-running is safe: seeding is skipped once any sale exists.
     */
    public function run(): void
    {
        if (Sale::query()->exists()) {
            $this->command?->warn('Sales already exist — skipping SaleSeeder.');

            return;
        }

        $userId = User::query()->where('role', Role::ADMIN)->value('id');

        if ($userId === null) {
            $this->command?->warn('No admin user found — run UserSeeder first.');

            return;
        }

        $stocked = Product::query()
            ->whereHas('inventory', fn ($query) => $query->where('quantity', '>=', 4))
            ->orderBy('id')
            ->get();

        // One product per category first so the category chart has variety,
        // then any remaining stocked products.
        $primary = $stocked->unique('category_id')->values();

        $products = $primary
            ->concat($stocked->whereNotIn('id', $primary->pluck('id')))
            ->values();

        if ($products->isEmpty()) {
            $this->command?->warn('Not enough stocked products — run InventorySeeder first.');

            return;
        }

        $service = app(SaleService::class);

        // [sold at, quantity, remarks] — newest first so a fresh database
        // shows a sale in every chart range.
        $demoSales = [
            [now(), 2, 'Walk-in customer'],
            [now()->subDays(3), 1, 'Delivery order'],
            [now()->subDays(10), 2, null],
            [now()->subDays(20), 1, 'Phone order'],
            [now()->subMonthNoOverflow(), 2, 'Repeat customer'],
            [now()->subMonthsNoOverflow(2), 1, 'Installation package'],
            [now()->subMonthsNoOverflow(4), 2, 'Walk-in customer'],
            [now()->subMonthsNoOverflow(5), 1, null],
        ];

        foreach ($demoSales as $index => [$soldAt, $quantity, $remarks]) {
            $sale = $service->createSale([
                [
                    'product_id' => $products[$index % $products->count()]->id,
                    'quantity' => $quantity,
                ],
            ], $userId, $remarks);

            $sale->created_at = $soldAt;
            $sale->save();
        }

        // Keep one voided sale so both sale states exist in the demo data.
        $voided = $service->createSale([
            ['product_id' => $products->first()->id, 'quantity' => 3],
        ], $userId, 'Phone order');

        $service->voidSale($voided, $userId);

        $voided->created_at = now()->subDays(6);
        $voided->save();
    }
}
