<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\User;
use App\Services\InventoryService;
use Illuminate\Database\Seeder;

class InventorySeeder extends Seeder
{
    /**
     * Seed an inventory record and an initial movement history for every
     * product. Quantities are derived from each product's reorder level so the
     * seeded data exercises the healthy, low-stock, and out-of-stock states,
     * and stock is added through InventoryService so each inventory's quantity
     * always equals the sum of its movements.
     *
     * Re-running is safe: inventories that already have movements are skipped.
     */
    public function run(): void
    {
        $products = Product::query()->orderBy('id')->get();

        if ($products->isEmpty()) {
            $this->command?->warn('No products found — run ProductSeeder first.');

            return;
        }

        $service = app(InventoryService::class);

        $userId = User::query()->where('role', Role::ADMIN)->value('id');

        $products->each(function (Product $product, int $index) use ($service, $userId): void {
            $inventory = Inventory::query()->firstOrCreate(
                ['product_id' => $product->id],
                ['quantity' => 0],
            );

            if ($inventory->movements()->exists()) {
                return;
            }

            $target = $this->targetQuantity($product->reorder_level, $index);

            if ($target > 0) {
                $service->stockIn($inventory, $target, $userId, 'Initial seeded stock');
            }
        });
    }

    /**
     * Deterministic stock level for a product, cycling through the four stock
     * states in seeding order: healthy, at reorder level, low, and empty.
     */
    private function targetQuantity(int $reorderLevel, int $index): int
    {
        return match ($index % 4) {
            3 => 0,
            2 => max($reorderLevel - 1, 0),
            1 => $reorderLevel,
            default => $reorderLevel * 3,
        };
    }
}
