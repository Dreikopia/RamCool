<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdjustStockRequest;
use App\Http\Requests\StockMovementRequest;
use App\Models\Inventory;
use App\Models\InventoryMovement;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryMovementController extends Controller
{
    public function __construct(private InventoryService $inventoryService) {}

    public function index(Request $request)
    {

        $search = $request->string('search')->value();

        return Inertia::render('Movements/Index', [
            'movements' => InventoryMovement::with([
                'inventory.product',
                'user',
            ])
                ->search($search)
                ->latest()
                ->get(),

            'filters' => [
                'search' => $search,
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
