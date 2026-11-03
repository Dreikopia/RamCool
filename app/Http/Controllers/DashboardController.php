<?php

namespace App\Http\Controllers;

use App\Enums\MovementType;
use App\Enums\StockStatus;
use App\Services\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(private DashboardService $dashboard) {}

    public function index(Request $request)
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:255'],
            'type' => ['nullable', Rule::enum(MovementType::class)],
            'status' => ['nullable', Rule::enum(StockStatus::class)],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $filters = array_merge([
            'q' => null,
            'type' => null,
            'status' => null,
            'from' => null,
            'to' => null,
        ], Arr::only($validated, ['q', 'type', 'status', 'from', 'to']));

        return Inertia::render('Dashboard/Index', [
            'kpis' => $this->dashboard->kpis(),
            'restockItems' => $this->dashboard->restockItems(),
            'salesTrend' => $this->dashboard->salesTrend(),
            'salesByCategory' => $this->dashboard->salesByCategory(),
            'movements' => $this->dashboard->movements($filters),
            'filters' => $filters,
        ]);
    }
}
