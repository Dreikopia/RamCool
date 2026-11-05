<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSaleRequest;
use App\Models\Product;
use App\Models\Sale;
use App\Services\SaleService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SaleController extends Controller
{
    public function __construct(private SaleService $saleService) {}

    public function index()
    {
        return Inertia::render('Sales/Index', [
            'sales' => Sale::query()
                ->with([
                    'user:id,name',
                    'items' => fn ($query) => $query->with([
                        'product' => fn ($productQuery) => $productQuery->withTrashed(),
                    ]),
                ])
                ->withCount('items')
                ->latest()
                ->orderByDesc('id')
                ->paginate(10),
        ]);
    }

    public function create(Request $request)
    {
        return Inertia::render('Sales/Create', [
            'products' => Product::query()
                ->active()
                ->with('inventory:id,product_id,quantity')
                ->search($request->string('q')->value())
                ->orderBy('name')
                ->get(),
            'productCount' => Product::query()->active()->count(),
        ]);
    }

    public function store(StoreSaleRequest $request)
    {

        $validated = $request->validated();

        $sale = $this->saleService->createSale(
            $validated['items'],
            $request->user()->id,
            $validated['remarks'] ?? null,
        );

        return redirect()
            ->route('sales')
            ->with('success', "Sale {$sale->sales_number} completed.");
    }

    public function void(Request $request, Sale $sale)
    {
        $sale = $this->saleService->voidSale(
            $sale,
            $request->user()->id,
        );

        return redirect()
            ->route('sales')
            ->with('success', "Sale {$sale->sales_number} voided.");
    }
}
