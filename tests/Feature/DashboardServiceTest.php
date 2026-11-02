<?php

use App\Enums\MovementType;
use App\Enums\SaleStatus;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Services\DashboardService;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->service = app(DashboardService::class);
    $this->user = User::factory()->create();
});

function makeSale(float $amount, SaleStatus $status = SaleStatus::COMPLETED): Sale
{
    return Sale::create([
        'sales_number' => 'S-'.str_pad((string) (Sale::count() + 1), 4, '0', STR_PAD_LEFT),
        'user_id' => User::factory()->create()->id,
        'total_amount' => $amount,
        'status' => $status,
    ]);
}

it('totals revenue from completed sales only', function () {
    makeSale(100.00);
    makeSale(50.00);
    makeSale(999.00, SaleStatus::VOIDED);

    expect($this->service->kpis()['total_revenue'])->toBe(150.0);
});

it('counts products rather than inventory rows', function () {
    $products = Product::factory()->count(5)->create();

    Inventory::factory()->for($products[0])->create();
    Inventory::factory()->for($products[1])->create();

    expect($this->service->kpis()['total_products'])->toBe(5);
});

it('counts low stock and out of stock products separately', function () {
    $low = Product::factory()->create(['reorder_level' => 10]);
    Inventory::factory()->for($low)->create(['quantity' => 4]);

    $out = Product::factory()->create(['reorder_level' => 10]);
    Inventory::factory()->for($out)->create(['quantity' => 0]);

    $noInventory = Product::factory()->create(['reorder_level' => 10]);

    $healthy = Product::factory()->create(['reorder_level' => 10]);
    Inventory::factory()->for($healthy)->create(['quantity' => 40]);

    $kpis = $this->service->kpis();

    expect($kpis['low_stock_count'])->toBe(1)
        ->and($kpis['out_of_stock_count'])->toBe(2);
});

it('returns low and out of stock items for restocking, most urgent first', function () {
    $healthy = Product::factory()->create(['reorder_level' => 5]);
    Inventory::factory()->for($healthy)->create(['quantity' => 50]);

    $low = Product::factory()->create(['reorder_level' => 10]);
    Inventory::factory()->for($low)->create(['quantity' => 6]);

    $out = Product::factory()->create(['reorder_level' => 10]);
    Inventory::factory()->for($out)->create(['quantity' => 0]);

    $items = $this->service->restockItems();

    expect($items->pluck('id')->all())->toBe([$out->id, $low->id])
        ->and($items->first()->stock_status['value'])->toBe('out_of_stock');
});

it('returns the five newest movements with their product and user', function () {
    $inventory = Inventory::factory()->create();

    foreach (range(1, 6) as $i) {
        $movement = $inventory->movements()->make([
            'user_id' => $this->user->id,
            'type' => MovementType::STOCK_IN,
            'quantity' => $i,
        ]);

        $movement->created_at = now()->subMinutes(10 - $i);
        $movement->save();
    }

    $movements = $this->service->latestMovements();

    expect($movements)->toHaveCount(5)
        ->and($movements->first()->quantity)->toBe(6)
        ->and($movements->first()->relationLoaded('inventory'))->toBeTrue()
        ->and($movements->first()->inventory->relationLoaded('product'))->toBeTrue()
        ->and($movements->first()->relationLoaded('user'))->toBeTrue();
});

it('renders the dashboard with kpis, restock items and movements', function () {
    $this->actingAs($this->user);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Index')
            ->has('kpis', 4)
            ->has('restockItems')
            ->has('movements'));
});
