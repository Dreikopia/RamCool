<?php

namespace App\Services;

use App\Enums\ProductStatus;
use App\Enums\SaleStatus;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleService
{
    public function __construct(private InventoryService $inventoryService) {}

    public function createSale(array $items, int $userId, ?string $remarks = null): Sale
    {
        return DB::transaction(function () use ($items, $userId, $remarks) {
            $sale = Sale::create([
                'user_id' => $userId,
                'total_amount' => 0,
                'status' => SaleStatus::COMPLETED,
                'remarks' => $remarks,
            ]);

            $sale->update([
                'sales_number' => 'S-'.str_pad((string) $sale->id, 4, '0', STR_PAD_LEFT),
            ]);

            $total = 0;

            foreach (collect($items)->sortBy('product_id') as $item) {
                $product = Product::with('inventory')->findOrFail($item['product_id']);
                $quantity = (int) $item['quantity'];

                if ($product->status !== ProductStatus::ACTIVE) {
                    throw ValidationException::withMessages([
                        'items' => "{$product->name}: product is inactive and cannot be sold.",
                    ]);
                }

                if ($product->inventory === null) {
                    throw ValidationException::withMessages([
                        'items' => "{$product->name}: no inventory record.",
                    ]);
                }

                $unitPrice = $product->unit_price;
                $subtotal = $unitPrice * $quantity;

                $sale->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'subtotal' => $subtotal,
                ]);

                try {
                    $this->inventoryService->stockOut(
                        $product->inventory,
                        $quantity,
                        $userId,
                        "Sale {$sale->sales_number}",
                        $sale->id
                    );
                } catch (ValidationException $e) {
                    throw ValidationException::withMessages([
                        'items' => "{$product->name}: ".($e->errors()['quantity'][0] ?? 'Invalid quantity.'),
                    ]);
                }

                $total += $subtotal;
            }

            $sale->update(['total_amount' => $total]);

            return $sale->refresh();
        });
    }

    public function voidSale(Sale $sale, int $userId): Sale
    {
        return DB::transaction(function () use ($sale, $userId) {
            $sale = Sale::query()
                ->lockForUpdate()
                ->with([
                    'items' => fn ($query) => $query->with([
                        'product' => fn ($productQuery) => $productQuery->withTrashed(),
                        'product.inventory',
                    ]),
                ])
                ->findOrFail($sale->id);

            if ($sale->status === SaleStatus::VOIDED) {
                throw ValidationException::withMessages([
                    'void' => 'This sale is already voided',
                ]);
            }

            foreach ($sale->items->sortBy('product_id') as $item) {
                $inventory = $item->product->inventory;

                if ($inventory === null) {
                    throw ValidationException::withMessages([
                        'items' => "{$item->product->name}: no inventory record.",
                    ]);
                }

                $this->inventoryService->stockIn(
                    $inventory,
                    $item->quantity,
                    $userId,
                    "Voided sale {$sale->sales_number}",
                    $sale->id
                );
            }

            $sale->update([
                'status' => SaleStatus::VOIDED,
                'voided_at' => now(),
            ]);

            return $sale->refresh();
        });
    }
}
