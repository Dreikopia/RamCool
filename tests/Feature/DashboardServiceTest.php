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

    $inactiveLow = Product::factory()->inactive()->create(['reorder_level' => 10]);
    Inventory::factory()->for($inactiveLow)->create(['quantity' => 4]);

    $inactiveOut = Product::factory()->inactive()->create(['reorder_level' => 10]);
    Inventory::factory()->for($inactiveOut)->create(['quantity' => 0]);

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

    $trend = $this->service->salesTrends()['months6'];

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

it('buckets sales by hour, day and month for every chart range', function () {
    $this->travelTo('2026-11-10 14:30:00');

    backdateSale(makeSale(40.00), '2026-11-10 09:15:00');
    backdateSale(makeSale(25.00), '2026-11-08 10:00:00');
    backdateSale(makeSale(60.00), '2026-10-20 10:00:00');
    makeSale(999.00, SaleStatus::VOIDED);

    $trends = $this->service->salesTrends();

    expect($trends['hourly'])->toHaveCount(24)
        ->and($trends['hourly'][0]['period'])->toBe('2026-11-09 15:00')
        ->and($trends['hourly'][0]['label'])->toBe('3 PM')
        ->and($trends['hourly'][18]['revenue'])->toBe(40.0)
        ->and($trends['hourly'][18]['orders'])->toBe(1)
        ->and($trends['days7'])->toHaveCount(7)
        ->and($trends['days7'][0]['label'])->toBe('Nov 4')
        ->and($trends['days7'][4]['revenue'])->toBe(25.0)
        ->and($trends['days30'])->toHaveCount(30)
        ->and($trends['days30'][8]['revenue'])->toBe(60.0)
        ->and($trends['days30'][29]['revenue'])->toBe(40.0)
        ->and($trends['months6'])->toHaveCount(6)
        ->and($trends['months6'][0]['label'])->toBe('Jun 2026')
        ->and($trends['months6'][4]['revenue'])->toBe(60.0)
        ->and($trends['months6'][5]['revenue'])->toBe(65.0)
        ->and($trends['months6'][5]['orders'])->toBe(2);
});

it('splits completed sales by category using units sold', function () {
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
        ->and($rows[0]['sales_count'])->toBe(2)
        ->and($rows[0]['percentage'])->toBe(66.7)
        ->and($rows[1]['name'])->toBe('Apparel')
        ->and($rows[1]['revenue'])->toBe(20.0)
        ->and($rows[1]['sales_count'])->toBe(1)
        ->and($rows[1]['percentage'])->toBe(33.3);
});

it('filters sales by category to the selected number of days', function () {
    $product = Product::factory()->create();

    $recent = makeSale(30.00);
    $recent->items()->create(['product_id' => $product->id, 'quantity' => 2, 'unit_price' => 15.00, 'subtotal' => 30.00]);
    $recent->created_at = now()->subDays(3);
    $recent->save();

    $older = makeSale(10.00);
    $older->items()->create(['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 10.00, 'subtotal' => 10.00]);
    $older->created_at = now()->subDays(20);
    $older->save();

    expect(collect($this->service->salesByCategory(7))->sum('sales_count'))->toBe(2)
        ->and(collect($this->service->salesByCategory(30))->sum('sales_count'))->toBe(3);
});

it('limits sales by category to the ten highest sales categories', function () {
    foreach (range(1, 11) as $i) {
        $category = Category::factory()->create(['name' => "Category {$i}"]);
        $product = Product::factory()->create(['category_id' => $category->id]);
        $sale = makeSale(100.00);
        $sale->items()->create([
            'product_id' => $product->id,
            'quantity' => $i,
            'unit_price' => 10.00,
            'subtotal' => 10.00 * $i,
        ]);
    }

    $rows = $this->service->salesByCategory();

    expect($rows)->toHaveCount(10)
        ->and($rows[0]['name'])->toBe('Category 11')
        ->and(collect($rows)->pluck('name')->all())->not->toContain('Category 1');
});

it('returns low and out of stock items for restocking, most urgent first', function () {
    $healthy = Product::factory()->create(['reorder_level' => 5]);
    Inventory::factory()->for($healthy)->create(['quantity' => 50]);

    $low = Product::factory()->create(['reorder_level' => 10]);
    Inventory::factory()->for($low)->create(['quantity' => 6]);

    $out = Product::factory()->create(['reorder_level' => 10]);
    Inventory::factory()->for($out)->create(['quantity' => 0]);

    $inactive = Product::factory()->inactive()->create(['reorder_level' => 10]);
    Inventory::factory()->for($inactive)->create(['quantity' => 0]);

    $items = $this->service->restockItems();

    expect($items->pluck('id')->all())->toBe([$out->id, $low->id])
        ->and($items->first()->stock_status['value'])->toBe('out_of_stock')
        ->and($items->pluck('id')->all())->not->toContain($inactive->id);
});

it('includes the inventory and recent movements for the restock drawer', function () {
    $product = Product::factory()->create(['reorder_level' => 10]);
    $inventory = Inventory::factory()->for($product)->create(['quantity' => 2]);

    $inventory->movements()->create([
        'user_id' => $this->user->id,
        'type' => MovementType::STOCK_IN,
        'quantity' => 5,
    ]);

    $item = $this->service->restockItems()->first();

    expect($item->inventory->id)->toBe($inventory->id)
        ->and($item->inventory->movements)->toHaveCount(1)
        ->and($item->inventory->movements->first()->user->id)->toBe($this->user->id);
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

    expect($movements)->toHaveCount(2)
        ->and($movements->first()->id)->toBe($outbound->id)
        ->and($movements->first()->direction)->toBe('outbound')
        ->and($movements->first()->inventory->product->name)->toBe('HEPA Filter')
        ->and($movements->first()->inventory->product->stock_status['value'])->toBe('low_stock')
        ->and($movements->last()->id)->toBe($inbound->id)
        ->and($movements->last()->direction)->toBe('inbound');
});

it('returns only the ten latest movements', function () {
    $inventory = Inventory::factory()->create();

    foreach (range(1, 11) as $i) {
        $inventory->movements()->create([
            'user_id' => $this->user->id,
            'type' => MovementType::STOCK_IN,
            'quantity' => $i,
        ]);
    }

    $movements = $this->service->movements();

    expect($movements)->toHaveCount(10)
        ->and($movements->first()->quantity)->toBe(11)
        ->and($movements->last()->quantity)->toBe(2);
});

it('renders the dashboard with kpis, charts, restock items and movements', function () {
    $this->actingAs($this->user);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/Index')
            ->has('kpis', 8)
            ->has('salesTrends.hourly', 24)
            ->has('salesTrends.days7', 7)
            ->has('salesTrends.days30', 30)
            ->has('salesTrends.months6', 6)
            ->has('salesByCategory.days7')
            ->has('salesByCategory.days30')
            ->has('restockItems')
            ->has('movements', 0));
});
