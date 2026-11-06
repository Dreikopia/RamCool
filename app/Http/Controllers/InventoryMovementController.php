<?php

namespace App\Http\Controllers;

use App\Enums\MovementType;
use App\Http\Requests\AdjustStockRequest;
use App\Http\Requests\StockMovementRequest;
use App\Models\Inventory;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\User;
use App\Services\InventoryService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class InventoryMovementController extends Controller
{
    public function __construct(private InventoryService $inventoryService) {}

    public function index(Request $request)
    {
        $rules = [
            'search' => ['nullable', 'string', 'max:255'],
            'type' => ['nullable', Rule::enum(MovementType::class)],
            'products' => ['nullable', 'array'],
            'products.*' => ['integer', 'distinct', Rule::exists('products', 'id')],
            'users' => ['nullable', 'array'],
            'users.*' => ['integer', 'distinct', Rule::exists('users', 'id')],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ];

        if ($request->filled('from')) {
            $rules['to'][] = 'after_or_equal:from';
        }

        $validated = $request->validate($rules);

        $search = trim((string) ($validated['search'] ?? ''));
        $type = isset($validated['type']) ? MovementType::from($validated['type']) : null;
        $productIds = array_map('intval', $validated['products'] ?? []);
        $userIds = array_map('intval', $validated['users'] ?? []);

        $from = isset($validated['from'])
            ? CarbonImmutable::parse($validated['from'])->startOfDay()
            : null;

        $to = isset($validated['to'])
            ? CarbonImmutable::parse($validated['to'])->endOfDay()
            : null;

        return Inertia::render('Movements/Index', [
            'movements' => InventoryMovement::query()
                ->with([
                    'inventory.product',
                    'user',
                ])
                ->search($search)
                ->ofType($type)
                ->forProducts($productIds)
                ->byUsers($userIds)
                ->createdBetween($from, $to)
                ->latest()
                ->get(),

            'products' => Product::query()
                ->whereHas('inventory.movements')
                ->orderBy('name')
                ->get(['id', 'name', 'sku'])
                ->map(fn (Product $product): array => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                ]),

            'users' => User::query()
                ->whereIn('id', InventoryMovement::query()
                    ->select('user_id')
                    ->whereNotNull('user_id'))
                ->orderBy('name')
                ->get(['id', 'name']),

            'filters' => [
                'search' => $search,
                'type' => $type?->value,
                'products' => $productIds,
                'users' => $userIds,
                'from' => $validated['from'] ?? null,
                'to' => $validated['to'] ?? null,
            ],
        ]);
    }

    public function stockIn(StockMovementRequest $request, Inventory $inventory)
    {

        $validated = $request->validated();

        $this->inventoryService->stockIn(
            $inventory,
            $validated['quantity'],
            $request->user()->id,
            $validated['remarks'] ?? null,
        );

        return back()->with('success', 'Stock has been added');
    }

    public function stockOut(StockMovementRequest $request, Inventory $inventory)
    {

        $validated = $request->validated();

        $this->inventoryService->stockOut(
            $inventory,
            $validated['quantity'],
            $request->user()->id,
            $validated['remarks'] ?? null,
        );

        return back()->with('info', 'stock has been deducted');
    }

    public function adjustment(AdjustStockRequest $request, Inventory $inventory)
    {

        $validated = $request->validated();

        $this->inventoryService->adjust(
            $inventory,
            $validated['quantity'],
            $request->user()->id,
            $validated['remarks'] ?? null,
        );

        return back()->with('success', 'Stock adjusted');
    }
}
