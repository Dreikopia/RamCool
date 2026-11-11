<?php

use App\Enums\SaleStatus;
use App\Models\Category;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Database\Seeders\SaleSeeder;

it('seeds sales across the dashboard chart ranges', function () {
    User::factory()->create(['email' => 'admin@test']);

    foreach (Category::factory()->count(8)->create() as $category) {
        $product = Product::factory()->create(['category_id' => $category->id]);
        Inventory::factory()->for($product)->create(['quantity' => 10]);
    }

    $this->seed(SaleSeeder::class);

    expect(Sale::query()->count())->toBe(9)
        ->and(Sale::query()->where('created_at', '<', now()->subDays(40))->count())->toBeGreaterThan(0)
        ->and(Sale::query()->where('status', SaleStatus::VOIDED)->count())->toBe(1);

    $this->seed(SaleSeeder::class);

    expect(Sale::query()->count())->toBe(9);
});
