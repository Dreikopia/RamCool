<?php

namespace App\Http\Controllers;

use App\Enums\ProductStatus;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProductController extends Controller
{
    /**
     * Render the products page with the product listing.
     */
    public function index(Request $request)
    {

        $search = $request->string('search')->value();

        $status = ProductStatus::tryFrom($request->string('status')->value());

        return Inertia::render('Products/Index', [
            'products' => Product::with([
                'category',
                'supplier',
                'inventory:id,product_id,quantity',
            ])
                ->search($search)
                ->when($status, fn ($query) => $query->where('status', $status->value))
                ->latest()
                ->get(),
            'categories' => Category::orderBy('name')->get(),
            'suppliers' => Supplier::orderBy('name')->get(['id', 'name']),

            'filters' => [
                'search' => $search,
                'status' => $status?->value,
            ],
        ]);
    }

    public function store(StoreProductRequest $request)
    {
        $validated = $request->validated();

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('images/products', 'public');
        }
        Product::create($validated);

        return redirect()
            ->route('products')
            ->with('success', 'Product created successfully.');
    }

    /**
     * Update an existing product, swapping the stored image only when one was
     * uploaded or explicitly removed.
     *
     * @param  array<int, mixed>  $validated
     */
    public function update(UpdateProductRequest $request, Product $product)
    {
        $validated = $request->validated();

        $imageProvided = $request->hasFile('image');
        $removeImage = $request->boolean('remove_image');

        unset($validated['image'], $validated['remove_image']);

        if ($imageProvided) {
            if ($product->image_path) {
                Storage::disk('public')->delete($product->image_path);
            }
            $validated['image_path'] = $request->file('image')->store('images/products', 'public');
        } elseif ($removeImage && $product->image_path) {
            Storage::disk('public')->delete($product->image_path);
            $validated['image_path'] = null;
        }

        $product->update($validated);

        return redirect()
            ->route('products')
            ->with('success', 'Product updated successfully.');
    }
}
