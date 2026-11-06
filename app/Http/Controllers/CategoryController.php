<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    /**
     * Render the category listing with product counts and search filtering.
     */
    public function index(Request $request): Response
    {
        $search = $request->string('search')->value();

        return Inertia::render('Categories/Index', [
            'categories' => Category::withCount('products')
                ->search($search)
                ->orderBy('name')
                ->get(),
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        Category::create($request->validated());

        return redirect()
            ->route('categories')
            ->with('success', 'Category created successfully.');
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $category->update($request->validated());

        return redirect()
            ->route('categories')
            ->with('success', 'Category updated successfully.');
    }

    /**
     * Delete a category that no longer has products assigned to it.
     *
     * The product guard runs on the backend (BR-07); the database foreign key
     * restricts deletion as a final backstop for rows the guard cannot see,
     * such as soft-deleted products still referencing the category.
     */
    public function destroy(Category $category): RedirectResponse
    {
        $productCount = $category->products()->count();

        if ($productCount > 0) {
            return back()->with('error', $this->deletionBlockedMessage($category, $productCount));
        }

        try {
            $category->delete();
        } catch (QueryException) {
            // A soft-deleted product row still references this category, so the
            // database blocks the delete even though the guard above passed.
            $count = $category->products()->withTrashed()->count();

            return back()->with('error', $this->deletionBlockedMessage($category, $count));
        }

        return redirect()
            ->route('categories')
            ->with('success', 'Category deleted successfully.');
    }

    private function deletionBlockedMessage(Category $category, int $count): string
    {
        $products = $count === 1 ? 'product' : 'products';

        return "Cannot delete \"{$category->name}\". This category currently has {$count} {$products} assigned to it. "
            .'Please reassign or remove the associated products before deleting this category.';
    }
}
