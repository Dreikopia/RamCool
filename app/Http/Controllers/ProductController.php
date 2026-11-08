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
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProductController extends Controller
{
    /**
     * Render the products page with the product listing.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::enum(ProductStatus::class)],
            'categories' => ['nullable', 'array'],
            'categories.*' => ['integer', 'distinct', Rule::exists('categories', 'id')],
            'suppliers' => ['nullable', 'array'],
            'suppliers.*' => ['integer', 'distinct', Rule::exists('suppliers', 'id')],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));
        $status = isset($validated['status'])
            ? ProductStatus::from($validated['status'])
            : null;
        $categoryIds = array_map('intval', $validated['categories'] ?? []);
        $supplierIds = array_map('intval', $validated['suppliers'] ?? []);

        return Inertia::render('Products/Index', [
            'products' => Product::with([
                'category',
                'supplier',
                'inventory:id,product_id,quantity',
            ])
                ->search($search)
                ->when($status, fn ($query) => $query->where('status', $status->value))
                ->when(
                    $categoryIds !== [],
                    fn ($query) => $query->whereIn('category_id', $categoryIds),
                )
                ->when(
                    $supplierIds !== [],
                    fn ($query) => $query->whereIn('supplier_id', $supplierIds),
                )
                ->latest()
                ->orderByDesc('id')
                ->paginate(8)
                ->withQueryString(),
            'categories' => Category::orderBy('name')->get(),
            'suppliers' => Supplier::orderBy('name')->get(['id', 'name']),

            'filters' => [
                'search' => $search,
                'status' => $status?->value,
                'categories' => $categoryIds,
                'suppliers' => $supplierIds,
            ],
        ]);
    }

    public function store(StoreProductRequest $request)
    {
        $this->authorize('create', Product::class);

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
        $this->authorize('update', $product);

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
