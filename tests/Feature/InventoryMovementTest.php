<?php

use App\Enums\MovementType;
use App\Enums\ProductStatus;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->inventory = Inventory::factory()
        ->for(Product::factory())
        ->create(['quantity' => 50]);
});

it('adds stock and records a stock in movement', function () {
    $response = $this->actingAs($this->user)->post(route('stock-in', $this->inventory), [
        'quantity' => 25,
        'remarks' => 'Supplier delivery',
    ]);

    $response->assertRedirect();

    expect($this->inventory->fresh()->quantity)->toBe(75);

    $movement = $this->inventory->movements()->sole();

    expect($movement->type)->toBe(MovementType::STOCK_IN)
        ->and($movement->quantity)->toBe(25)
        ->and($movement->inventory_id)->toBe($this->inventory->id)
        ->and($movement->user_id)->toBe($this->user->id)
        ->and($movement->remarks)->toBe('Supplier delivery');
});

it('deducts stock and records a stock out movement', function () {
    $this->actingAs($this->user)->post(route('stock-out', $this->inventory), [
        'quantity' => 10,
    ]);

    expect($this->inventory->fresh()->quantity)->toBe(40);

    $movement = $this->inventory->movements()->sole();

    expect($movement->type)->toBe(MovementType::STOCK_OUT)
        ->and($movement->quantity)->toBe(-10)
        ->and($movement->user_id)->toBe($this->user->id);
});

it('allows stock movements for inactive products', function () {
    $this->inventory->product->update(['status' => ProductStatus::INACTIVE]);

    $this->actingAs($this->user)->post(route('stock-in', $this->inventory), [
        'quantity' => 10,
        'remarks' => 'Returned from customer',
    ])->assertRedirect();

    $this->post(route('stock-out', $this->inventory), [
        'quantity' => 5,
        'remarks' => 'Written off',
    ])->assertRedirect();

    expect($this->inventory->fresh()->quantity)->toBe(55)
        ->and($this->inventory->movements()->count())->toBe(2);
});

it('rejects a stock out that exceeds the available stock', function () {
    $response = $this->actingAs($this->user)->from('/products')->post(route('stock-out', $this->inventory), [
        'quantity' => 51,
    ]);

    $response->assertSessionHasErrors('quantity');

    expect($this->inventory->fresh()->quantity)->toBe(50)
        ->and($this->inventory->movements()->count())->toBe(0);
});

it('rejects a stock in with a non positive quantity', function () {
    $response = $this->actingAs($this->user)->from('/products')->post(route('stock-in', $this->inventory), [
        'quantity' => 0,
    ]);

    $response->assertSessionHasErrors('quantity');

    expect($this->inventory->fresh()->quantity)->toBe(50)
        ->and($this->inventory->movements()->count())->toBe(0);
});

it('adjusts stock up and down', function () {
    $this->actingAs($this->user)->post(route('adjustment', $this->inventory), [
        'quantity' => 10,
        'remarks' => 'Correction after count',
    ]);

    $this->post(route('adjustment', $this->inventory), [
        'quantity' => -20,
        'remarks' => 'Damaged units',
    ]);

    expect($this->inventory->fresh()->quantity)->toBe(40);

    $movements = $this->inventory->movements()->get();

    expect($movements->pluck('type')->toArray())->toBe([MovementType::ADJUSTMENT, MovementType::ADJUSTMENT])
        ->and($movements->pluck('quantity')->toArray())->toBe([10, -20]);
});

it('stores adjustment movements using the adjusted enum value', function () {
    $this->actingAs($this->user)->post(route('adjustment', $this->inventory), [
        'quantity' => 5,
        'remarks' => 'Recount',
    ]);

    $movement = $this->inventory->movements()->sole();

    expect($movement->type->value)->toBe('adjustment');
});

it('rejects an adjustment of zero', function () {
    $response = $this->actingAs($this->user)->from('/products')->post(route('adjustment', $this->inventory), [
        'quantity' => 0,
        'remarks' => 'No change recorded',
    ]);

    $response->assertSessionHasErrors('quantity');

    expect($this->inventory->fresh()->quantity)->toBe(50)
        ->and($this->inventory->movements()->count())->toBe(0);
});

it('allows an adjustment without remarks', function () {
    $response = $this->actingAs($this->user)->post(route('adjustment', $this->inventory), [
        'quantity' => 5,
    ]);

    $response->assertRedirect();

    expect($this->inventory->fresh()->quantity)->toBe(55);

    $movement = $this->inventory->movements()->sole();

    expect($movement->type)->toBe(MovementType::ADJUSTMENT)
        ->and($movement->remarks)->toBeNull();
});

it('requires a quantity for stock movements', function () {
    $this->actingAs($this->user)->from('/products')->post(route('stock-in', $this->inventory), [])
        ->assertSessionHasErrors('quantity');

    $this->from('/products')->post(route('stock-out', $this->inventory), [])
        ->assertSessionHasErrors('quantity');

    expect($this->inventory->fresh()->quantity)->toBe(50)
        ->and($this->inventory->movements()->count())->toBe(0);
});

it('does not allow guests to change stock', function () {
    $response = $this->from(route('login'))->post(route('stock-in', $this->inventory), [
        'quantity' => 25,
    ]);

    $response->assertRedirect(route('login'));

    expect($this->inventory->fresh()->quantity)->toBe(50)
        ->and($this->inventory->movements()->count())->toBe(0);
});
