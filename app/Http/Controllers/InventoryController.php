<?php

namespace App\Http\Controllers;

use App\Enums\StockStatus;
use App\Models\Category;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'categories' => ['nullable', 'array'],
            'categories.*' => ['integer', 'distinct', Rule::exists('categories', 'id')],
            'stock_status' => ['nullable', Rule::enum(StockStatus::class)],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));
        $categoryIds = array_map('intval', $validated['categories'] ?? []);
        $stockStatus = isset($validated['stock_status'])
            ? StockStatus::from($validated['stock_status'])
            : null;

        return Inertia::render('Inventory/Index', [
            'inventories' => Inventory::query()
                ->with([
                    'product.category',
                    'movements' => fn ($query) => $query->with('user')->latest()->take(5),
                ])
                ->when(
                    $search !== '',
                    fn ($query) => $query->whereHas(
                        'product',
                        fn ($product) => $product->search($search),
                    ),
                )
                ->when(
                    $categoryIds !== [],
                    fn ($query) => $query->whereHas(
                        'product',
                        fn ($product) => $product->whereIn('category_id', $categoryIds),
                    ),
                )
                ->when($stockStatus === StockStatus::OUT_OF_STOCK, fn ($query) => $query->where('quantity', 0))
                ->when(
                    $stockStatus === StockStatus::LOW_STOCK,
                    fn ($query) => $query->where('quantity', '>', 0)->whereHas(
                        'product',
                        fn ($product) => $product->whereColumn(
                            'products.reorder_level',
                            '>=',
                            'inventories.quantity',
                        ),
                    ),
                )
                ->when(
                    $stockStatus === StockStatus::IN_STOCK,
                    fn ($query) => $query->whereHas(
                        'product',
                        fn ($product) => $product->whereColumn(
                            'products.reorder_level',
                            '<',
                            'inventories.quantity',
                        ),
                    ),
                )
                ->latest()
                ->orderByDesc('id')
                ->paginate(8)
                ->withQueryString(),

            'categories' => Category::query()
                ->orderBy('name')
                ->get(['id', 'name']),

            'filters' => [
                'search' => $search,
                'categories' => $categoryIds,
                'stock_status' => $stockStatus?->value,
            ],
        ]);
    }
}
