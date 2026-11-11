<?php

use App\Enums\ProductStatus;
use App\Enums\Role;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->actingAs(User::factory()->create(['role' => Role::ADMIN]));
});

it('creates a product with an uploaded image', function () {
    Storage::fake('public');
    $category = Category::factory()->create();

    $response = $this->post(route('products.store'), [
        'name' => '20x20x1 MERV 11 Filter',
        'sku' => 'AC-TEST-01',
        'category_id' => $category->id,
        'unit_price' => 19.99,
        'reorder_level' => 25,
        'image' => UploadedFile::fake()->image('filter.jpg'),
    ]);

    $response
        ->assertRedirect(route('products'))
        ->assertSessionHas('success', 'Product created successfully.');

    $product = Product::query()->where('sku', 'AC-TEST-01')->first();

    expect($product->inventory)->not->toBeNull()
        ->and($product->inventory->quantity)->toBe(0);

    $product->inventory->update(['quantity' => 120]);

    expect($product->fresh())->not->toBeNull()
        ->and($product->name)->toBe('20x20x1 MERV 11 Filter')
        ->and($product->category_id)->toBe($category->id)
        ->and($product->in_stock)->toBe(120)
        ->and($product->status)->toBe(ProductStatus::ACTIVE)
        ->and($product->reorder_level)->toBe(25)
        ->and($product->image_path)->toStartWith('images/products/');

    Storage::disk('public')->assertExists($product->image_path);
});

it('creates a product without an image', function () {
    $category = Category::factory()->create();

    $response = $this->post(route('products.store'), [
        'name' => 'Smart Wi-Fi Thermostat',
        'sku' => 'AC-TEST-02',
        'category_id' => $category->id,
        'unit_price' => 149.00,
        'reorder_level' => 10,
    ]);

    $response->assertRedirect(route('products'));

    $product = Product::query()->where('sku', 'AC-TEST-02')->first();

    expect($product)->not->toBeNull()
        ->and($product->image_path)->toBeNull();
});

it('rejects a product when the image is not a supported image file', function () {
    $category = Category::factory()->create();

    $response = $this->post(route('products.store'), [
        'name' => 'Duct Seam Mastic Sealant',
        'sku' => 'AC-TEST-03',
        'category_id' => $category->id,
        'unit_price' => 9.50,
        'reorder_level' => 5,
        'image' => UploadedFile::fake()->create('manual.txt', 12, 'text/plain'),
    ]);

    $response->assertSessionHasErrors('image');

    expect(Product::query()->where('sku', 'AC-TEST-03')->exists())->toBeFalse();
});

it('rejects a product with required fields missing', function () {
    $response = $this->post(route('products.store'), []);

    $response->assertSessionHasErrors(['name', 'sku', 'category_id', 'unit_price', 'reorder_level']);

    $this->assertDatabaseCount('products', 0);
});

it('rejects a product with a duplicate sku', function () {
    $product = Product::factory()->create(['sku' => 'AC-DUPLICATE']);

    $response = $this->post(route('products.store'), [
        'name' => 'Another Filter',
        'sku' => $product->sku,
        'category_id' => $product->category_id,
        'unit_price' => 12.00,
        'reorder_level' => 4,
    ]);

    $response->assertSessionHasErrors('sku');

    $this->assertDatabaseCount('products', 1);
});

it('updates a product', function () {
    $product = Product::factory()->create([
        'name' => 'Old Name',
        'sku' => 'AC-UPDATE-01',
    ]);
    $category = Category::factory()->create();

    $response = $this->put(route('products.update', $product), [
        'name' => 'New Name',
        'sku' => $product->sku,
        'category_id' => $category->id,
        'status' => 'inactive',
        'unit_price' => 42.50,
        'reorder_level' => 12,
    ]);

    $response
        ->assertRedirect(route('products'))
        ->assertSessionHas('success', 'Product updated successfully.');

    expect($product->fresh())
        ->name->toBe('New Name')
        ->category_id->toBe($category->id)
        ->status->toBe(ProductStatus::INACTIVE)
        ->unit_price->toBe(42.50)
        ->reorder_level->toBe(12);
});

it('replaces the product image and deletes the previous file', function () {
    Storage::fake('public');
    $product = Product::factory()->withImage()->create();
    $originalPath = $product->image_path;

    $response = $this->put(route('products.update', $product), [
        'name' => $product->name,
        'sku' => $product->sku,
        'category_id' => $product->category_id,
        'unit_price' => $product->unit_price,
        'reorder_level' => $product->reorder_level,
        'image' => UploadedFile::fake()->image('replacement.png'),
    ]);

    $response->assertRedirect(route('products'));

    $product->refresh();

    expect($product->image_path)->toStartWith('images/products/')
        ->and($product->image_path)->not->toBe($originalPath);

    Storage::disk('public')->assertExists($product->image_path);
    Storage::disk('public')->assertMissing($originalPath);
});

it('removes the product image when asked and no new file is sent', function () {
    Storage::fake('public');
    $product = Product::factory()->withImage()->create();
    $originalPath = $product->image_path;

    $response = $this->put(route('products.update', $product), [
        'name' => $product->name,
        'sku' => $product->sku,
        'category_id' => $product->category_id,
        'unit_price' => $product->unit_price,
        'reorder_level' => $product->reorder_level,
        'remove_image' => true,
    ]);

    $response->assertRedirect(route('products'));

    expect($product->fresh()->image_path)->toBeNull();
    Storage::disk('public')->assertMissing($originalPath);
});

it('keeps the existing product image when neither is sent', function () {
    Storage::fake('public');
    $product = Product::factory()->withImage()->create();
    $originalPath = $product->image_path;

    $this->put(route('products.update', $product), [
        'name' => $product->name,
        'sku' => $product->sku,
        'category_id' => $product->category_id,
        'unit_price' => $product->unit_price,
        'reorder_level' => $product->reorder_level,
    ])->assertRedirect(route('products'));

    expect($product->fresh()->image_path)->toBe($originalPath);
    Storage::disk('public')->assertExists($originalPath);
});

it('rejects an update with required fields missing', function () {
    $product = Product::factory()->create();

    $response = $this->put(route('products.update', $product), []);

    $response->assertSessionHasErrors(['name', 'sku', 'category_id', 'unit_price', 'reorder_level']);

    expect($product->fresh()->name)->toBe($product->name);
});

it('allows a product to keep its own sku on update', function () {
    $product = Product::factory()->create(['sku' => 'AC-KEEP-01']);

    $response = $this->put(route('products.update', $product), [
        'name' => $product->name,
        'sku' => 'AC-KEEP-01',
        'category_id' => $product->category_id,
        'unit_price' => $product->unit_price,
        'reorder_level' => $product->reorder_level,
    ]);

    $response->assertRedirect(route('products'));
    $response->assertSessionHasNoErrors();
});

it('rejects an update with a sku taken by another product', function () {
    $taken = Product::factory()->create(['sku' => 'AC-TAKEN']);
    $product = Product::factory()->create(['sku' => 'AC-OWNER']);

    $response = $this->put(route('products.update', $product), [
        'name' => $product->name,
        'sku' => $taken->sku,
        'category_id' => $product->category_id,
        'unit_price' => $product->unit_price,
        'reorder_level' => $product->reorder_level,
    ]);

    $response->assertSessionHasErrors('sku');

    expect($product->fresh()->sku)->toBe('AC-OWNER');
});

it('rejects an update when the image is not a supported image file', function () {
    $product = Product::factory()->create();

    $response = $this->put(route('products.update', $product), [
        'name' => $product->name,
        'sku' => $product->sku,
        'category_id' => $product->category_id,
        'unit_price' => $product->unit_price,
        'reorder_level' => $product->reorder_level,
        'image' => UploadedFile::fake()->create('manual.txt', 12, 'text/plain'),
    ]);

    $response->assertSessionHasErrors('image');
});

it('adds an image to a product that has none without touching the disk', function () {
    Storage::fake('public');
    $product = Product::factory()->create(['image_path' => null]);

    $response = $this->put(route('products.update', $product), [
        'name' => $product->name,
        'sku' => $product->sku,
        'category_id' => $product->category_id,
        'unit_price' => $product->unit_price,
        'reorder_level' => $product->reorder_level,
        'image' => UploadedFile::fake()->image('first.png'),
    ]);

    $response->assertRedirect(route('products'));

    $product->refresh();

    expect($product->image_path)->toStartWith('images/products/');
    Storage::disk('public')->assertExists($product->image_path);
});

it('keeps the existing product image when remove_image is sent as false', function () {
    Storage::fake('public');
    $product = Product::factory()->withImage()->create();

    // Inertia writes booleans into FormData as "1"/"0".
    $response = $this->put(route('products.update', $product), [
        'name' => $product->name,
        'sku' => $product->sku,
        'category_id' => $product->category_id,
        'unit_price' => $product->unit_price,
        'reorder_level' => $product->reorder_level,
        'remove_image' => '0',
    ]);

    $response->assertSessionHasNoErrors();

    $product->refresh();

    expect($product->image_path)->not->toBeNull();
    Storage::disk('public')->assertExists($product->image_path);
});

it('lists products with their appended status, stock status, stock level and image url', function () {
    Storage::fake('public');

    $active = Product::factory()->create([
        'sku' => 'AC-LIST-01',
        'reorder_level' => 10,
    ]);
    Inventory::factory()->for($active)->create(['quantity' => 100]);

    $withImage = Product::factory()->inactive()->withImage()->create([
        'sku' => 'AC-LIST-02',
    ]);
    Inventory::factory()->for($withImage)->create(['quantity' => 50]);

    $this->get(route('products'))
        ->assertOk()
        ->assertInertia(function (Assert $page) use ($withImage) {
            $page->component('Products/Index')
                ->has('products.data', 2)
                ->where('products.data', function (Collection $products) use ($withImage) {
                    $bySku = $products->keyBy('sku');

                    expect($bySku['AC-LIST-01']['status'])->toBe('active')
                        ->and($bySku['AC-LIST-01']['in_stock'])->toBe(100)
                        ->and($bySku['AC-LIST-01']['stock_status'])->toBe([
                            'value' => 'in_stock',
                            'label' => 'In stock',
                        ])
                        ->and($bySku['AC-LIST-01']['image_url'])->toBeNull()
                        ->and($bySku['AC-LIST-02']['status'])->toBe('inactive')
                        ->and($bySku['AC-LIST-02']['in_stock'])->toBe(50)
                        ->and($bySku['AC-LIST-02']['stock_status']['value'])->toBe('in_stock')
                        ->and($bySku['AC-LIST-02']['image_url'])
                        ->toBe(Storage::disk('public')->url($withImage->image_path));

                    return true;
                });
        });
});

it('creates an inactive product', function () {
    $category = Category::factory()->create();

    $this->post(route('products.store'), [
        'name' => 'Retired Air Conditioner',
        'sku' => 'AC-STATUS-01',
        'status' => 'inactive',
        'category_id' => $category->id,
        'unit_price' => 250.00,
        'reorder_level' => 2,
    ])->assertRedirect(route('products'));

    $product = Product::query()->where('sku', 'AC-STATUS-01')->sole();

    expect($product->status)->toBe(ProductStatus::INACTIVE);
});

it('rejects an invalid product status', function () {
    $category = Category::factory()->create();

    $this->post(route('products.store'), [
        'name' => 'Unknown Status Product',
        'sku' => 'AC-STATUS-02',
        'status' => 'discontinued',
        'category_id' => $category->id,
        'unit_price' => 10.00,
        'reorder_level' => 1,
    ])->assertSessionHasErrors('status');

    expect(Product::query()->where('sku', 'AC-STATUS-02')->exists())->toBeFalse();
});
