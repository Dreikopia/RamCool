<?php

namespace App\Http\Controllers;

use App\Enums\SaleStatus;
use App\Http\Requests\StoreSaleRequest;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Services\SaleService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SaleController extends Controller
{
    public function __construct(private SaleService $saleService) {}

    public function index(Request $request)
    {
        $rules = [
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::enum(SaleStatus::class)],
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
        $status = isset($validated['status'])
            ? SaleStatus::from($validated['status'])
            : null;
        $userIds = array_map('intval', $validated['users'] ?? []);

        $from = isset($validated['from'])
            ? CarbonImmutable::parse($validated['from'])->startOfDay()
            : null;

        $to = isset($validated['to'])
            ? CarbonImmutable::parse($validated['to'])->endOfDay()
            : null;

        return Inertia::render('Sales/Index', [
            'sales' => Sale::query()
                ->with([
                    'user:id,name',
                    'items' => fn ($query) => $query->with([
                        'product' => fn ($productQuery) => $productQuery->withTrashed(),
                    ]),
                ])
                ->withCount('items')
                ->when($search !== '', function ($query) use ($search): void {
                    $like = '%'.addcslashes($search, '%_\\').'%';

                    $query->where(function ($query) use ($like): void {
                        $query->where('sales_number', 'like', $like)
                            ->orWhere('remarks', 'like', $like);
                    });
                })
                ->when($status, fn ($query) => $query->where('status', $status->value))
                ->when($userIds !== [], fn ($query) => $query->whereIn('user_id', $userIds))
                ->when($from, fn ($query) => $query->where('created_at', '>=', $from))
                ->when($to, fn ($query) => $query->where('created_at', '<=', $to))
                ->latest()
                ->orderByDesc('id')
                ->paginate(8)
                ->withQueryString(),

            'users' => User::query()
                ->whereIn('id', Sale::query()
                    ->select('user_id')
                    ->whereNotNull('user_id'))
                ->orderBy('name')
                ->get(['id', 'name']),

            'filters' => [
                'search' => $search,
                'status' => $status?->value,
                'users' => $userIds,
                'from' => $validated['from'] ?? null,
                'to' => $validated['to'] ?? null,
            ],
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
        $this->authorize('void', $sale);

        $sale = $this->saleService->voidSale(
            $sale,
            $request->user()->id,
        );

        return redirect()
            ->route('sales')
            ->with('success', "Sale {$sale->sales_number} voided.");
    }
}
