<?php

use App\Enums\Role;
use App\Enums\SaleStatus;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Supplier;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->staff = User::factory()->create(['role' => Role::STAFF]);
    $this->admin = User::factory()->create(['role' => Role::ADMIN]);
});

it('forbids staff from managing categories', function () {
    $category = Category::factory()->create(['name' => 'Ductwork']);

    $this->actingAs($this->staff)
        ->post(route('category.store'), ['name' => 'New Category'])
        ->assertForbidden();

    $this->actingAs($this->staff)
        ->patch(route('category.update', $category), ['name' => 'Renamed'])
        ->assertForbidden();

    $this->actingAs($this->staff)
        ->delete(route('category.destroy', $category))
        ->assertForbidden();

    expect($category->fresh()->name)->toBe('Ductwork');
});

it('forbids staff from managing products', function () {
    $category = Category::factory()->create();
    $product = Product::factory()->create(['name' => 'Old Name']);

    $payload = [
        'name' => 'New Product',
        'sku' => 'AC-STAFF-01',
        'category_id' => $category->id,
        'unit_price' => 10.00,
        'reorder_level' => 5,
    ];

    $this->actingAs($this->staff)
        ->post(route('products.store'), $payload)
        ->assertForbidden();

    $this->actingAs($this->staff)
        ->put(route('products.update', $product), [
            ...$payload,
            'name' => 'Renamed',
            'sku' => $product->sku,
        ])
        ->assertForbidden();

    expect($product->fresh()->name)->toBe('Old Name');
});

it('forbids staff from managing suppliers', function () {
    $supplier = Supplier::factory()->create(['name' => 'Old Supplier']);

    $this->actingAs($this->staff)
        ->post(route('suppliers.store'), ['name' => 'New Supplier'])
        ->assertForbidden();

    $this->actingAs($this->staff)
        ->patch(route('suppliers.update', $supplier), ['name' => 'Renamed'])
        ->assertForbidden();

    expect($supplier->fresh()->name)->toBe('Old Supplier');
});

it('forbids staff from voiding a sale', function () {
    $sale = Sale::create([
        'sales_number' => 'S-0001',
        'user_id' => $this->staff->id,
        'total_amount' => 50,
        'status' => SaleStatus::COMPLETED,
    ]);

    $this->actingAs($this->staff)
        ->patch(route('sales.void', $sale))
        ->assertForbidden();

    expect($sale->fresh()->status)->toBe(SaleStatus::COMPLETED);
});

it('lets staff record a sale and move stock', function () {
    $product = Product::factory()->create(['unit_price' => 20.00]);
    $inventory = Inventory::factory()->for($product)->create(['quantity' => 10]);

    $this->actingAs($this->staff)
        ->post(route('sales.store'), [
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ])
        ->assertRedirect(route('sales'));

    $this->actingAs($this->staff)
        ->post(route('stock-in', $inventory), ['quantity' => 5])
        ->assertRedirect();

    expect($inventory->fresh()->quantity)->toBe(13)
        ->and(Sale::query()->count())->toBe(1);
});

it('shares the catalog and void abilities with the frontend', function () {
    $this->actingAs($this->staff)
        ->get(route('products'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.can.manageCatalog', false)
            ->where('auth.can.voidSales', false)
        );

    $this->actingAs($this->admin)
        ->get(route('products'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.can.manageCatalog', true)
            ->where('auth.can.voidSales', true)
        );
});
