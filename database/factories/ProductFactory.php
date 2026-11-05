<?php

namespace Database\Factories;

use App\Enums\ProductStatus;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Http\UploadedFile;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => ucwords(fake()->unique()->words(3, true)),
            'sku' => strtoupper(fake()->unique()->bothify('AC-#####')),
            'status' => ProductStatus::ACTIVE,
            'category_id' => Category::factory(),
            'unit_price' => fake()->randomFloat(2, 5, 500),
            'reorder_level' => fake()->numberBetween(3, 20),
        ];
    }

    /**
     * Indicate that the product is at or below its reorder level.
     */
    public function lowStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'current_stock' => fake()->numberBetween(0, $attributes['reorder_level']),
        ]);
    }

    /**
     * Indicate that the product is no longer sold in new transactions.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => ProductStatus::INACTIVE,
        ]);
    }

    /**
     * Indicate that the product has an image stored on the public disk.
     */
    public function withImage(): static
    {
        return $this->state(fn () => [
            'image_path' => UploadedFile::fake()
                ->image('product.jpg')
                ->store('images/products', 'public'),
        ]);
    }
}
