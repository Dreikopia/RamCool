<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(private DashboardService $dashboard) {}

    public function index()
    {
        return Inertia::render('Dashboard/Index', [
            'kpis' => $this->dashboard->kpis(),
            'restockItems' => $this->dashboard->restockItems(),
            'salesTrend' => $this->dashboard->salesTrend(),
            'weeklySalesTrend' => $this->dashboard->weeklySalesTrend(),
            'salesByCategory' => $this->dashboard->salesByCategory(),
            'movements' => $this->dashboard->movements(),
        ]);
    }
}
