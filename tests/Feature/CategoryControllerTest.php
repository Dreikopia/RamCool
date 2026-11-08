<?php

use App\Enums\Role;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Collection;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->actingAs(User::factory()->create(['role' => Role::ADMIN]));
});

it('lists categories with product counts and descriptions', function () {
    $withProducts = Category::factory()->create([
        'name' => 'HEPA Filters',
        'description' => 'Captures 99.97% of airborne particles.',
    ]);
    Product::factory()->count(2)->create(['category_id' => $withProducts->id]);

    $empty = Category::factory()->create([
        'name' => 'Thermostats',
        'description' => null,
    ]);

    $this->get(route('categories'))
        ->assertOk()
        ->assertInertia(function (Assert $page) {
            $page->component('Categories/Index')
                ->has('categories.data', 2)
                ->where('categories.data', function (Collection $categories) {
                    $byName = $categories->keyBy('name');

                    expect($byName['HEPA Filters']['description'])
                        ->toBe('Captures 99.97% of airborne particles.')
                        ->and($byName['HEPA Filters']['products_count'])->toBe(2)
                        ->and($byName['Thermostats']['description'])->toBeNull()
                        ->and($byName['Thermostats']['products_count'])->toBe(0);

                    return true;
                })
                ->where('filters.search', '');
        });
});

it('filters categories by name', function () {
    Category::factory()->create(['name' => 'HEPA Filters']);
    Category::factory()->create(['name' => 'HVAC Parts']);

    $this->get(route('categories', ['search' => 'hepa']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Categories/Index')
            ->has('categories.data', 1)
            ->where('categories.data.0.name', 'HEPA Filters')
            ->where('filters.search', 'hepa'));
});

it('creates a category', function () {
    $response = $this->post(route('category.store'), [
        'name' => 'Air Purifiers',
        'description' => 'Stand-alone units that clean room air.',
    ]);

    $response
        ->assertRedirect(route('categories'))
        ->assertSessionHas('success', 'Category created successfully.');

    $category = Category::query()->where('name', 'Air Purifiers')->sole();

    expect($category->description)->toBe('Stand-alone units that clean room air.');
});

it('rejects a category without a name', function () {
    $this->post(route('category.store'), ['description' => 'No name supplied'])
        ->assertSessionHasErrors('name');

    $this->assertDatabaseCount('categories', 0);
});

it('rejects a duplicate category name on create', function () {
    Category::factory()->create(['name' => 'Ductwork']);

    $this->post(route('category.store'), ['name' => 'Ductwork'])
        ->assertSessionHasErrors('name');

    $this->assertDatabaseCount('categories', 1);
});

it('updates a category without touching its products', function () {
    $category = Category::factory()->create([
        'name' => 'Old Name',
        'description' => 'Old description.',
    ]);
    $product = Product::factory()->create(['category_id' => $category->id]);

    $response = $this->patch(route('category.update', $category), [
        'name' => 'New Name',
        'description' => 'New description.',
    ]);

    $response
        ->assertRedirect(route('categories'))
        ->assertSessionHas('success', 'Category updated successfully.');

    expect($category->fresh())
        ->name->toBe('New Name')
        ->description->toBe('New description.');

    expect($product->fresh()->category_id)->toBe($category->id);
});

it('allows a category to keep its own name on update', function () {
    $category = Category::factory()->create(['name' => 'HVAC Parts']);

    $this->patch(route('category.update', $category), ['name' => 'HVAC Parts'])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('categories'));

    expect($category->fresh()->name)->toBe('HVAC Parts');
});

it('rejects an update with a name taken by another category', function () {
    Category::factory()->create(['name' => 'Air Filters']);
    $category = Category::factory()->create(['name' => 'Thermostats']);

    $this->patch(route('category.update', $category), ['name' => 'Air Filters'])
        ->assertSessionHasErrors('name');

    expect($category->fresh()->name)->toBe('Thermostats');
});

it('rejects deleting a category that still has products', function () {
    $category = Category::factory()->create(['name' => 'HEPA Filters']);
    $product = Product::factory()->create(['category_id' => $category->id]);

    $response = $this->delete(route('category.destroy', $category));

    $response
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($response->getSession()->get('error'))
        ->toContain('This category currently has 1 product assigned to it.');

    $this->assertModelExists($category);
    expect($product->fresh())->not->toBeNull();
});

it('deletes a category without products', function () {
    $category = Category::factory()->create(['name' => 'Ductwork']);

    $this->delete(route('category.destroy', $category))
        ->assertRedirect(route('categories'))
        ->assertSessionHas('success', 'Category deleted successfully.');

    $this->assertModelMissing($category);
});

it('blocks deletion at the database level when a soft-deleted product still references the category', function () {
    $category = Category::factory()->create(['name' => 'Air Conditioners']);
    $product = Product::factory()->create(['category_id' => $category->id]);
    $product->delete();

    $this->delete(route('category.destroy', $category))
        ->assertRedirect()
        ->assertSessionHas('error');

    $this->assertModelExists($category);
});

it('returns 404 when deleting a category that does not exist', function () {
    $this->delete('/categories/9999')->assertNotFound();
});

it('requires authentication for category routes', function () {
    auth()->logout();

    $category = Category::factory()->create();

    $this->get(route('categories'))->assertRedirect(route('login'));
    $this->post(route('category.store'), ['name' => 'No Auth'])->assertRedirect(route('login'));
    $this->patch(route('category.update', $category), ['name' => 'No Auth'])->assertRedirect(route('login'));
    $this->delete(route('category.destroy', $category))->assertRedirect(route('login'));

    $this->assertModelExists($category);
});
