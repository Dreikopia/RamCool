<?php

use App\Enums\MovementType;
use App\Enums\SaleStatus;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Services\SaleService;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

it('redirects guests to the login page', function () {
    auth()->logout();

    $this->get(route('sales'))->assertRedirect(route('login'));
    $this->get(route('sales.create'))->assertRedirect(route('login'));
    $this->post(route('sales.store'), [])->assertRedirect(route('login'));
});

it('renders the sales index page', function () {
    $this->get(route('sales'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Sales/Index'));
});

it('lists sales newest first with their item count and cashier', function () {
    $older = Sale::create([
        'sales_number' => 'S-0001',
        'user_id' => $this->user->id,
        'total_amount' => 300,
        'status' => SaleStatus::COMPLETED,
    ]);

    $older->forceFill(['created_at' => now()->subDay()])->save();

    $newer = Sale::create([
        'sales_number' => 'S-0002',
        'user_id' => $this->user->id,
        'total_amount' => 1250,
        'status' => SaleStatus::VOIDED,
        'voided_at' => now(),
    ]);

    $product = Product::factory()->create();

    $newer->items()->create([
        'product_id' => $product->id,
        'quantity' => 3,
        'unit_price' => 100,
        'subtotal' => 300,
    ]);

    $this->get(route('sales'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Sales/Index')
            ->has('sales.data', 2)
            ->where('sales.data.0.sales_number', 'S-0002')
            ->where('sales.data.0.items_count', 1)
            ->where('sales.data.0.user.name', $this->user->name)
            ->has('sales.data.0.items', 1)
            ->where('sales.data.0.items.0.product.name', $product->name)
            ->where('sales.data.0.items.0.quantity', 3)
            ->where('sales.data.0.items.0.unit_price', fn ($value) => (float) $value === 100.0)
            ->where('sales.data.0.items.0.subtotal', fn ($value) => (float) $value === 300.0)
            ->where('sales.data.1.sales_number', 'S-0001')
            ->where('sales.data.1.items_count', 0)
        );
});

it('keeps sale item product details when the product was soft deleted', function () {
    $product = Product::factory()->create(['name' => 'Retired fan motor']);
    Inventory::factory()->for($product)->create(['quantity' => 10]);

    $sale = app(SaleService::class)->createSale([
        ['product_id' => $product->id, 'quantity' => 2],
    ], $this->user->id);

    $product->delete();

    $this->get(route('sales'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Sales/Index')
            ->where('sales.data.0.sales_number', $sale->sales_number)
            ->where('sales.data.0.items.0.product.name', 'Retired fan motor')
            ->where('sales.data.0.items.0.quantity', 2)
        );
});

it('renders the create page with products and their inventory', function () {
    $product = Product::factory()->create(['name' => 'Split Air Conditioner']);
    Inventory::factory()->for($product)->create(['quantity' => 12]);

    $this->get(route('sales.create'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Sales/Create')
            ->has('products', 1)
            ->where('products.0.id', $product->id)
            ->where('products.0.name', 'Split Air Conditioner')
            ->where('products.0.inventory.quantity', 12)
        );
});

it('stores a sale, deducts stock and redirects to the sales index', function () {
    $product = Product::factory()->create(['unit_price' => 25.50]);
    $inventory = Inventory::factory()->for($product)->create(['quantity' => 10]);

    $response = $this->post(route('sales.store'), [
        'items' => [
            ['product_id' => $product->id, 'quantity' => 2],
        ],
        'remarks' => 'Walk-in customer',
    ]);

    $response
        ->assertRedirect(route('sales'))
        ->assertSessionHas('success', 'Sale S-0001 completed.');

    $sale = Sale::query()->sole();

    expect($sale->sales_number)->toBe('S-0001')
        ->and($sale->user_id)->toBe($this->user->id)
        ->and($sale->status)->toBe(SaleStatus::COMPLETED)
        ->and($sale->remarks)->toBe('Walk-in customer')
        ->and((float) $sale->total_amount)->toBe(51.0)
        ->and($inventory->fresh()->quantity)->toBe(8);

    $movement = $inventory->movements()->sole();

    expect($movement->type)->toBe(MovementType::STOCK_OUT)
        ->and($movement->quantity)->toBe(-2)
        ->and($movement->sale_id)->toBe($sale->id)
        ->and($movement->user_id)->toBe($this->user->id)
        ->and($movement->remarks)->toBe('Sale S-0001');
});

it('stores a sale with multiple products and totals the subtotals', function () {
    $first = Product::factory()->create(['unit_price' => 10.00]);
    $second = Product::factory()->create(['unit_price' => 5.00]);

    $firstInventory = Inventory::factory()->for($first)->create(['quantity' => 10]);
    $secondInventory = Inventory::factory()->for($second)->create(['quantity' => 10]);

    $this->post(route('sales.store'), [
        'items' => [
            ['product_id' => $first->id, 'quantity' => 3],
            ['product_id' => $second->id, 'quantity' => 4],
        ],
    ])->assertRedirect(route('sales'));

    $sale = Sale::query()->sole();

    expect((float) $sale->total_amount)->toBe(50.0)
        ->and($sale->items()->count())->toBe(2)
        ->and($firstInventory->fresh()->quantity)->toBe(7)
        ->and($secondInventory->fresh()->quantity)->toBe(6);
});

it('rejects a sale without items', function () {
    $this->post(route('sales.store'), [])
        ->assertSessionHasErrors('items');

    $this->assertDatabaseCount('sales', 0);
});

it('rejects the same product twice in one sale', function () {
    $product = Product::factory()->create();
    Inventory::factory()->for($product)->create(['quantity' => 10]);

    $this->post(route('sales.store'), [
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
            ['product_id' => $product->id, 'quantity' => 1],
        ],
    ])->assertSessionHasErrors('items.1.product_id');

    $this->assertDatabaseCount('sales', 0);
});

it('rejects a product that does not exist', function () {
    $this->post(route('sales.store'), [
        'items' => [['product_id' => 999999, 'quantity' => 1]],
    ])->assertSessionHasErrors('items.0.product_id');

    $this->assertDatabaseCount('sales', 0);
});

it('rejects a product that has been soft deleted', function () {
    $product = Product::factory()->create();
    Inventory::factory()->for($product)->create(['quantity' => 10]);

    $product->delete();

    $this->post(route('sales.store'), [
        'items' => [['product_id' => $product->id, 'quantity' => 1]],
    ])->assertSessionHasErrors('items.0.product_id');

    $this->assertDatabaseCount('sales', 0);
});

it('rejects a non positive quantity', function () {
    $product = Product::factory()->create();
    Inventory::factory()->for($product)->create(['quantity' => 10]);

    $this->post(route('sales.store'), [
        'items' => [['product_id' => $product->id, 'quantity' => 0]],
    ])->assertSessionHasErrors('items.0.quantity');

    $this->assertDatabaseCount('sales', 0);
});

it('rejects a product without an inventory record', function () {
    $product = Product::factory()->create();

    $this->post(route('sales.store'), [
        'items' => [['product_id' => $product->id, 'quantity' => 1]],
    ])->assertSessionHasErrors('items');

    $this->assertDatabaseCount('sales', 0);
});

it('rolls back the sale when the stock is insufficient', function () {
    $product = Product::factory()->create(['unit_price' => 10.00]);
    $inventory = Inventory::factory()->for($product)->create(['quantity' => 1]);

    $this->post(route('sales.store'), [
        'items' => [['product_id' => $product->id, 'quantity' => 2]],
    ])->assertSessionHasErrors('items');

    $this->assertDatabaseCount('sales', 0);
    $this->assertDatabaseCount('sale_items', 0);
    $this->assertDatabaseCount('inventory_movements', 0);

    expect($inventory->fresh()->quantity)->toBe(1);
});

it('voids a sale and restores the inventory', function () {
    $product = Product::factory()->create(['unit_price' => 10.00]);
    $inventory = Inventory::factory()->for($product)->create(['quantity' => 10]);

    $sale = app(SaleService::class)->createSale([
        ['product_id' => $product->id, 'quantity' => 3],
    ], $this->user->id);

    $this->patch(route('sales.void', $sale))
        ->assertRedirect(route('sales'))
        ->assertSessionHas('success', 'Sale S-0001 voided.');

    $sale->refresh();

    expect($sale->status)->toBe(SaleStatus::VOIDED)
        ->and($sale->voided_at)->not->toBeNull()
        ->and($inventory->fresh()->quantity)->toBe(10);

    $restock = $inventory->movements()
        ->where('type', MovementType::STOCK_IN)
        ->sole();

    expect($restock->quantity)->toBe(3)
        ->and($restock->sale_id)->toBe($sale->id)
        ->and($restock->remarks)->toBe('Voided sale S-0001');
});

it('rejects voiding an already voided sale', function () {
    $product = Product::factory()->create(['unit_price' => 10.00]);
    $inventory = Inventory::factory()->for($product)->create(['quantity' => 10]);

    $sale = app(SaleService::class)->createSale([
        ['product_id' => $product->id, 'quantity' => 3],
    ], $this->user->id);

    $this->patch(route('sales.void', $sale))->assertRedirect(route('sales'));

    $this->from(route('sales'))
        ->patch(route('sales.void', $sale))
        ->assertSessionHasErrors('void');

    expect($inventory->fresh()->quantity)->toBe(10)
        ->and($inventory->movements()->count())->toBe(2);
});

it('restores stock when voiding a sale whose product was soft deleted', function () {
    $product = Product::factory()->create(['unit_price' => 10.00]);
    $inventory = Inventory::factory()->for($product)->create(['quantity' => 10]);

    $sale = app(SaleService::class)->createSale([
        ['product_id' => $product->id, 'quantity' => 2],
    ], $this->user->id);

    $product->delete();

    $this->patch(route('sales.void', $sale))->assertRedirect(route('sales'));

    expect($sale->fresh()->status)->toBe(SaleStatus::VOIDED)
        ->and($inventory->fresh()->quantity)->toBe(10);
});
