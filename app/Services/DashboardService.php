<?php

namespace App\Services;

use App\Enums\SaleStatus;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class DashboardService
{
    /**
     * Headline numbers shown on the dashboard cards.
     *
     * @return array{total_revenue: float, total_products: int, low_stock_count: int, out_of_stock_count: int}
     */
    public function kpis(): array
    {
        return [
            'total_revenue' => (float) Sale::query()
                ->where('status', SaleStatus::COMPLETED)
                ->sum('total_amount'),
            'total_products' => Product::count(),
            'low_stock_count' => $this->stockLevelCount('low'),
            'out_of_stock_count' => $this->stockLevelCount('out'),
        ];
    }

    /**
     * Products at or below their reorder level, most urgent first.
     *
     * Products without an inventory row count as quantity 0, matching
     * the Product::stock_status appender.
     *
     * @return Collection<int, Product>
     */
    public function restockItems(): Collection
    {
        return Product::query()
            ->with(['inventory', 'category:id,name', 'supplier:id,name'])
            ->where(function (Builder $query): void {
                $query->whereDoesntHave('inventory')
                    ->orWhereHas('inventory', function (Builder $inventory): void {
                        $inventory->whereColumn('quantity', '<=', 'products.reorder_level');
                    });
            })
            ->get()
            ->sortBy([
                fn (Product $a, Product $b) => $this->quantityOf($a) <=> $this->quantityOf($b),
                fn (Product $a, Product $b) => $a->id <=> $b->id,
            ])
            ->values();
    }

    /**
     * The most recent stock movements for the dashboard feed.
     *
     * @return Collection<int, InventoryMovement>
     */
    public function latestMovements(int $limit = 5): Collection
    {
        return InventoryMovement::query()
            ->with(['inventory.product', 'user:id,name'])
            ->latest()
            ->take($limit)
            ->get();
    }

    /**
     * Count products in a stock level: "low" is above zero but at or
     * below the reorder level, "out" is zero (or has no inventory row).
     */
    private function stockLevelCount(string $level): int
    {
        return Product::query()
            ->where(function (Builder $query) use ($level): void {
                if ($level === 'out') {
                    $query->whereDoesntHave('inventory')
                        ->orWhereHas('inventory', fn (Builder $inventory) => $inventory->where('quantity', 0));

                    return;
                }

                $query->whereHas('inventory', function (Builder $inventory): void {
                    $inventory->where('quantity', '>', 0)
                        ->whereColumn('quantity', '<=', 'products.reorder_level');
                });
            })
            ->count();
    }

    private function quantityOf(Product $product): int
    {
        return $product->inventory?->quantity ?? 0;
    }
}
