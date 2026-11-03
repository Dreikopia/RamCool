<?php

use App\Enums\MovementType;
use App\Enums\SaleStatus;
use App\Models\Category;
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

function backdateSale(Sale $sale, string $date): Sale
{
    $sale->created_at = $date;
    $sale->save();

    return $sale;
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

it('counts products added within the last thirty days', function () {
    Product::factory()->create();

    $older = Product::factory()->create();
    $older->created_at = now()->subDays(31);
    $older->save();

    expect($this->service->kpis()['products_added_recently'])->toBe(1);
});

it('compares month to date revenue with the same days of the previous month', function () {
    $this->travelTo('2026-11-15 12:00:00');

    backdateSale(makeSale(120.00), '2026-11-05 09:00:00');
    backdateSale(makeSale(100.00), '2026-10-10 09:00:00');
    backdateSale(makeSale(500.00), '2026-10-20 09:00:00');

    $kpis = $this->service->kpis();

    expect($kpis['revenue_this_month'])->toBe(120.0)
        ->and($kpis['revenue_previous_month'])->toBe(100.0)
        ->and($kpis['revenue_trend_percent'])->toBe(20.0);
});

it('has no revenue trend when the previous month window had no sales', function () {
    $this->travelTo('2026-11-15 12:00:00');

    makeSale(100.00);

    $kpis = $this->service->kpis();

    expect($kpis['revenue_this_month'])->toBe(100.0)
        ->and($kpis['revenue_previous_month'])->toBe(0.0)
        ->and($kpis['revenue_trend_percent'])->toBeNull();
});

it('returns six monthly revenue buckets and ignores voided sales', function () {
    $this->travelTo('2026-11-03 10:00:00');

    makeSale(50.00);
    backdateSale(makeSale(70.00), '2026-08-15 10:00:00');
    makeSale(999.00, SaleStatus::VOIDED);

    $trend = $this->service->salesTrend();

    expect($trend)->toHaveCount(6)
        ->and($trend[0]['period'])->toBe('2026-06')
        ->and($trend[0]['revenue'])->toBe(0.0)
        ->and($trend[0]['orders'])->toBe(0)
        ->and($trend[2]['period'])->toBe('2026-08')
        ->and($trend[2]['revenue'])->toBe(70.0)
        ->and($trend[5]['period'])->toBe('2026-11')
        ->and($trend[5]['revenue'])->toBe(50.0)
        ->and($trend[5]['orders'])->toBe(1);
});

it('splits completed sales revenue by category', function () {
    $electronics = Category::factory()->create(['name' => 'Electronics']);
    $apparel = Category::factory()->create(['name' => 'Apparel']);

    $purifier = Product::factory()->create(['category_id' => $electronics->id]);
    $cover = Product::factory()->create(['category_id' => $apparel->id]);

    $sale = makeSale(80.00);
    $sale->items()->create(['product_id' => $purifier->id, 'quantity' => 2, 'unit_price' => 30.00, 'subtotal' => 60.00]);
    $sale->items()->create(['product_id' => $cover->id, 'quantity' => 1, 'unit_price' => 20.00, 'subtotal' => 20.00]);

    $voided = makeSale(500.00, SaleStatus::VOIDED);
    $voided->items()->create(['product_id' => $purifier->id, 'quantity' => 5, 'unit_price' => 100.00, 'subtotal' => 500.00]);

    $rows = $this->service->salesByCategory();

    expect($rows)->toHaveCount(2)
        ->and($rows[0]['name'])->toBe('Electronics')
        ->and($rows[0]['revenue'])->toBe(60.0)
        ->and($rows[0]['percentage'])->toBe(75.0)
        ->and($rows[1]['name'])->toBe('Apparel')
        ->and($rows[1]['revenue'])->toBe(20.0)
        ->and($rows[1]['percentage'])->toBe(25.0);
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

it('returns movements newest first with product, direction and stock status', function () {
    $product = Product::factory()->create(['name' => 'HEPA Filter', 'reorder_level' => 10]);
    $inventory = Inventory::factory()->for($product)->create(['quantity' => 4]);

    $inbound = $inventory->movements()->create([
        'user_id' => $this->user->id,
        'type' => MovementType::STOCK_IN,
        'quantity' => 20,
    ]);

    $outbound = $inventory->movements()->create([
        'user_id' => $this->user->id,
        'type' => MovementType::STOCK_OUT,
        'quantity' => -6,
    ]);

    $movements = $this->service->movements();

    expect($movements->total())->toBe(2)
        ->and($movements->first()->id)->toBe($outbound->id)
        ->and($movements->first()->direction)->toBe('outbound')
        ->and($movements->first()->inventory->product->name)->toBe('HEPA Filter')
        ->and($movements->first()->inventory->product->stock_status['value'])->toBe('low_stock')
        ->and($movements->last()->id)->toBe($inbound->id)
        ->and($movements->last()->direction)->toBe('inbound');
});

it('filters movements by product, type, status and date range', function () {
    $low = Product::factory()->create(['name' => 'HEPA Filter', 'reorder_level' => 10]);
    $lowInventory = Inventory::factory()->for($low)->create(['quantity' => 4]);

    $out = Product::factory()->create(['name' => 'Carbon Pad', 'reorder_level' => 10]);
    $outInventory = Inventory::factory()->for($out)->create(['quantity' => 0]);

    $healthy = Product::factory()->create(['name' => 'Dust Mask', 'reorder_level' => 5]);
    $healthyInventory = Inventory::factory()->for($healthy)->create(['quantity' => 50]);

    $old = $lowInventory->movements()->create([
        'user_id' => $this->user->id,
        'type' => MovementType::STOCK_IN,
        'quantity' => 20,
    ]);
    $old->created_at = now()->subDays(10);
    $old->save();

    $recentOut = $outInventory->movements()->create([
        'user_id' => $this->user->id,
        'type' => MovementType::STOCK_OUT,
        'quantity' => -5,
    ]);

    $recentAdjustment = $healthyInventory->movements()->create([
        'user_id' => $this->user->id,
        'type' => MovementType::ADJUSTMENT,
        'quantity' => 3,
    ]);

    expect($this->service->movements(['q' => 'HEPA'])->total())->toBe(1)
        ->and($this->service->movements(['q' => 'HEPA'])->first()->id)->toBe($old->id)
        ->and($this->service->movements(['type' => 'stock_out'])->total())->toBe(1)
        ->and($this->service->movements(['type' => 'stock_out'])->first()->id)->toBe($recentOut->id)
        ->and($this->service->movements(['status' => 'out_of_stock'])->total())->toBe(1)
        ->and($this->service->movements(['status' => 'out_of_stock'])->first()->id)->toBe($recentOut->id)
        ->and($this->service->movements([
            'from' => now()->subDays(2)->toDateString(),
            'to' => now()->toDateString(),
        ])->pluck('id')->all())->toEqualCanonicalizing([$recentOut->id, $recentAdjustment->id]);
});

it('returns at most ten movements per page', function () {
    $inventory = Inventory::factory()->create();

    foreach (range(1, 11) as $i) {
        $inventory->movements()->create([
            'user_id' => $this->user->id,
            'type' => MovementType::STOCK_IN,
            'quantity' => $i,
        ]);
    }

    $movements = $this->service->movements();

    expect($movements->total())->toBe(11)
        ->and($movements)->toHaveCount(10);
});

it('renders the dashboard with kpis, charts, restock items and movements', function () {
    $this->actingAs($this->user);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Index')
            ->has('kpis', 8)
            ->has('salesTrend', 6)
            ->has('salesByCategory')
            ->has('restockItems')
            ->has('movements.data')
            ->has('filters', 5));
});

it('rejects movement filters that are not valid enum values', function () {
    $this->actingAs($this->user);

    $this->get(route('dashboard', ['type' => 'invalid', 'status' => 'unknown']))
        ->assertInvalid(['type', 'status']);
});
