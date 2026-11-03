<?php

namespace App\Services;

use App\Enums\SaleStatus;
use App\Enums\StockStatus;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;

class DashboardService
{
    private const RECENT_PRODUCT_DAYS = 30;

    private const TREND_MONTHS = 6;

    private const MOVEMENTS_PER_PAGE = 10;

    public function kpis(): array
    {
        $now = now();
        $currentStart = $now->copy()->startOfMonth();
        $previousStart = $currentStart->copy()->subMonthNoOverflow();
        $previousEnd = $previousStart->copy()->addDays($now->day - 1)->endOfDay();
        $previousMonthEnd = $previousStart->copy()->endOfMonth();

        if ($previousEnd->greaterThan($previousMonthEnd)) {
            $previousEnd = $previousMonthEnd;
        }

        $currentRevenue = $this->completedRevenueBetween($currentStart, $now);
        $previousRevenue = $this->completedRevenueBetween($previousStart, $previousEnd);

        return [
            'total_revenue' => (float) Sale::query()
                ->where('status', SaleStatus::COMPLETED)
                ->sum('total_amount'),
            'revenue_this_month' => round($currentRevenue, 2),
            'revenue_previous_month' => round($previousRevenue, 2),
            'revenue_trend_percent' => $previousRevenue > 0
                ? round((($currentRevenue - $previousRevenue) / $previousRevenue) * 100, 1)
                : null,
            'total_products' => Product::count(),
            'products_added_recently' => Product::query()
                ->where('created_at', '>=', $now->copy()->subDays(self::RECENT_PRODUCT_DAYS))
                ->count(),
            'low_stock_count' => $this->stockLevelCount('low'),
            'out_of_stock_count' => $this->stockLevelCount('out'),
        ];
    }

    public function salesTrend(): array
    {
        $start = now()->startOfMonth()->subMonths(self::TREND_MONTHS - 1);

        $sales = Sale::query()
            ->where('status', SaleStatus::COMPLETED)
            ->where('created_at', '>=', $start)
            ->get(['created_at', 'total_amount']);

        $buckets = [];

        for ($offset = 0; $offset < self::TREND_MONTHS; $offset++) {
            $month = $start->copy()->addMonths($offset);

            $buckets[$month->format('Y-m')] = [
                'period' => $month->format('Y-m'),
                'label' => $month->format('M Y'),
                'revenue' => 0.0,
                'orders' => 0,
            ];
        }

        foreach ($sales as $sale) {
            $key = $sale->created_at->format('Y-m');

            if (! isset($buckets[$key])) {
                continue;
            }

            $buckets[$key]['revenue'] += (float) $sale->total_amount;
            $buckets[$key]['orders']++;
        }

        return array_map(
            fn (array $bucket): array => [
                'period' => $bucket['period'],
                'label' => $bucket['label'],
                'revenue' => round($bucket['revenue'], 2),
                'orders' => $bucket['orders'],
            ],
            array_values($buckets),
        );
    }

    public function salesByCategory(): array
    {
        $rows = SaleItem::query()
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->where('sales.status', SaleStatus::COMPLETED)
            ->groupBy('categories.id', 'categories.name')
            ->select(['categories.id as category_id', 'categories.name as name'])
            ->selectRaw('SUM(sale_items.subtotal) as revenue')
            ->orderByDesc('revenue')
            ->get();

        $total = (float) $rows->sum('revenue');

        return $rows->map(fn (SaleItem $row): array => [
            'category_id' => (int) $row->category_id,
            'name' => (string) $row->name,
            'revenue' => round((float) $row->revenue, 2),
            'percentage' => $total > 0 ? round(((float) $row->revenue / $total) * 100, 1) : 0.0,
        ])->all();
    }

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

    public function movements(array $filters = []): LengthAwarePaginator
    {
        return InventoryMovement::query()
            ->with(['inventory.product', 'inventory.product.inventory', 'user:id,name'])
            ->when($filters['type'] ?? null, fn (Builder $query, string $type) => $query->where('type', $type))
            ->when($filters['q'] ?? null, fn (Builder $query, string $term) => $query->whereHas(
                'inventory.product',
                fn (Builder $product) => $product->search($term),
            ))
            ->when($filters['status'] ?? null, fn (Builder $query, string $status) => $this->applyStatusFilter($query, $status))
            ->when($filters['from'] ?? null, fn (Builder $query, string $from) => $query->where('created_at', '>=', Carbon::parse($from)->startOfDay()))
            ->when($filters['to'] ?? null, fn (Builder $query, string $to) => $query->where('created_at', '<=', Carbon::parse($to)->endOfDay()))
            ->latest()
            ->orderByDesc('id')
            ->paginate(self::MOVEMENTS_PER_PAGE)
            ->withQueryString();
    }

    private function applyStatusFilter(Builder $query, string $status): void
    {
        $stockStatus = StockStatus::from($status);

        $query->whereHas('inventory', function (Builder $inventory) use ($stockStatus): void {
            $inventory->whereHas('product', function (Builder $product) use ($stockStatus): void {
                match ($stockStatus) {
                    StockStatus::OUT_OF_STOCK => $product->where('inventories.quantity', 0),
                    StockStatus::LOW_STOCK => $product
                        ->where('inventories.quantity', '>', 0)
                        ->whereColumn('inventories.quantity', '<=', 'products.reorder_level'),
                    StockStatus::IN_STOCK => $product->whereColumn('inventories.quantity', '>', 'products.reorder_level'),
                };
            });
        });
    }

    private function completedRevenueBetween(CarbonInterface $start, CarbonInterface $end): float
    {
        return (float) Sale::query()
            ->where('status', SaleStatus::COMPLETED)
            ->whereBetween('created_at', [$start, $end])
            ->sum('total_amount');
    }

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
