<?php

use App\Enums\MovementType;
use App\Models\Inventory;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\User;
use Carbon\CarbonImmutable;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->actor = User::factory()->create(['name' => 'Ada']);
    $this->otherUser = User::factory()->create(['name' => 'Grace']);

    $this->filterProduct = Product::factory()->create([
        'name' => 'HEPA Filter',
        'sku' => 'AC-100',
    ]);
    $this->filterInventory = Inventory::factory()
        ->for($this->filterProduct)
        ->create();

    $this->thermostat = Product::factory()->create([
        'name' => 'Smart Thermostat',
        'sku' => 'AC-200',
    ]);
    $this->thermostatInventory = Inventory::factory()
        ->for($this->thermostat)
        ->create();

    $this->actingAs($this->actor);
});

/**
 * Create a movement with a predictable timestamp.
 */
function createFilterMovement(Inventory $inventory, array $attributes = []): InventoryMovement
{
    $movement = $inventory->movements()->create([
        'type' => $attributes['type'] ?? MovementType::STOCK_IN,
        'quantity' => $attributes['quantity'] ?? 5,
        'user_id' => $attributes['user_id'] ?? null,
        'remarks' => $attributes['remarks'] ?? null,
    ]);

    $movement->forceFill([
        'created_at' => $attributes['created_at'] ?? CarbonImmutable::now(),
    ])->save();

    return $movement;
}

it('filters movements by type', function () {
    createFilterMovement($this->filterInventory, ['type' => MovementType::STOCK_IN]);
    $stockOut = createFilterMovement($this->filterInventory, [
        'type' => MovementType::STOCK_OUT,
        'quantity' => -3,
    ]);
    createFilterMovement($this->filterInventory, ['type' => MovementType::ADJUSTMENT]);

    $this->get(route('movements.index', ['type' => MovementType::STOCK_OUT->value]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Movements/Index')
            ->has('movements.data', 1)
            ->where('movements.data.0.id', $stockOut->id)
            ->where('filters.type', MovementType::STOCK_OUT->value)
        );
});

it('searches remarks, product names and skus', function () {
    createFilterMovement($this->filterInventory, ['remarks' => 'Supplier delivery']);
    $damaged = createFilterMovement($this->thermostatInventory, ['remarks' => 'Damaged on arrival']);

    $this->get(route('movements.index', ['search' => 'HEPA']))
        ->assertInertia(fn (Assert $page) => $page->has('movements.data', 1));

    $this->get(route('movements.index', ['search' => 'AC-200']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('movements.data', 1)
            ->where('movements.data.0.id', $damaged->id)
        );

    $this->get(route('movements.index', ['search' => 'Damaged']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('movements.data', 1)
            ->where('movements.data.0.id', $damaged->id)
        );
});

it('groups search conditions so they cannot bypass other filters', function () {
    createFilterMovement($this->filterInventory, [
        'type' => MovementType::STOCK_IN,
        'remarks' => 'matching term',
    ]);
    $stockOut = createFilterMovement($this->filterInventory, [
        'type' => MovementType::STOCK_OUT,
        'quantity' => -2,
        'remarks' => 'matching term',
    ]);

    $this->get(route('movements.index', [
        'search' => 'matching term',
        'type' => MovementType::STOCK_OUT->value,
    ]))->assertInertia(fn (Assert $page) => $page
        ->has('movements.data', 1)
        ->where('movements.data.0.id', $stockOut->id)
    );
});

it('filters by multiple products and users', function () {
    $matching = createFilterMovement($this->filterInventory, [
        'user_id' => $this->otherUser->id,
    ]);

    createFilterMovement($this->filterInventory, [
        'user_id' => $this->actor->id,
    ]);
    createFilterMovement($this->thermostatInventory, [
        'user_id' => $this->otherUser->id,
    ]);

    $this->get(route('movements.index', [
        'products' => [$this->filterProduct->id],
        'users' => [$this->otherUser->id],
    ]))->assertInertia(fn (Assert $page) => $page
        ->has('movements.data', 1)
        ->where('movements.data.0.id', $matching->id)
        ->where('filters.products', [$this->filterProduct->id])
        ->where('filters.users', [$this->otherUser->id])
    );
});

it('filters movements between two dates inclusively', function () {
    createFilterMovement($this->filterInventory, [
        'created_at' => CarbonImmutable::parse('2026-10-31 23:59:59'),
    ]);
    $firstDay = createFilterMovement($this->filterInventory, [
        'created_at' => CarbonImmutable::parse('2026-11-01 00:00:00'),
    ]);
    $lastDay = createFilterMovement($this->filterInventory, [
        'created_at' => CarbonImmutable::parse('2026-11-05 23:59:59'),
    ]);
    createFilterMovement($this->filterInventory, [
        'created_at' => CarbonImmutable::parse('2026-11-06 00:00:00'),
    ]);

    $this->get(route('movements.index', [
        'from' => '2026-11-01',
        'to' => '2026-11-05',
    ]))->assertInertia(fn (Assert $page) => $page
        ->has('movements.data', 2)
        ->where('movements.data.0.id', $lastDay->id)
        ->where('movements.data.1.id', $firstDay->id)
    );
});

it('returns product and user filter options from movements', function () {
    createFilterMovement($this->filterInventory, ['user_id' => $this->actor->id]);
    createFilterMovement($this->thermostatInventory, ['user_id' => $this->otherUser->id]);

    Product::factory()->create(['name' => 'Never Moved']);

    $this->get(route('movements.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('products', 2)
            ->has('users', 2)
            ->where('products.0.sku', 'AC-100')
            ->where('products.1.sku', 'AC-200')
            ->where('users.0.name', 'Ada')
            ->where('users.1.name', 'Grace')
        );
});

it('returns the current filters', function () {
    $this->get(route('movements.index', [
        'search' => 'filter',
        'type' => MovementType::ADJUSTMENT->value,
        'products' => [$this->filterProduct->id],
        'users' => [$this->otherUser->id],
        'from' => '2026-11-01',
        'to' => '2026-11-05',
    ]))->assertInertia(fn (Assert $page) => $page
        ->where('filters.search', 'filter')
        ->where('filters.type', MovementType::ADJUSTMENT->value)
        ->where('filters.products', [$this->filterProduct->id])
        ->where('filters.users', [$this->otherUser->id])
        ->where('filters.from', '2026-11-01')
        ->where('filters.to', '2026-11-05')
    );
});

it('paginates movements ten at a time and keeps filters in the links', function () {
    foreach (range(1, 12) as $index) {
        createFilterMovement($this->filterInventory, [
            'remarks' => "Movement {$index}",
        ]);
    }

    $this->get(route('movements.index', ['search' => 'Movement']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('movements.data', 10)
            ->where('movements.current_page', 1)
            ->where('movements.last_page', 2)
            ->where('movements.total', 12)
            ->where(
                'movements.links.2.url',
                route('movements.index', ['search' => 'Movement', 'page' => 2]),
            )
        );

    $this->get(route('movements.index', ['search' => 'Movement', 'page' => 2]))
        ->assertInertia(fn (Assert $page) => $page
            ->has('movements.data', 2)
            ->where('movements.current_page', 2)
        );
});

it('rejects invalid filter values', function () {
    $this->from(route('movements.index'))->get(route('movements.index', ['type' => 'invalid']))
        ->assertSessionHasErrors('type');

    $this->from(route('movements.index'))->get(route('movements.index', ['products' => [999999]]))
        ->assertSessionHasErrors('products.0');

    $this->from(route('movements.index'))->get(route('movements.index', ['users' => [999999]]))
        ->assertSessionHasErrors('users.0');

    $this->from(route('movements.index'))->get(route('movements.index', [
        'from' => '2026-11-05',
        'to' => '2026-11-01',
    ]))->assertSessionHasErrors('to');
});
