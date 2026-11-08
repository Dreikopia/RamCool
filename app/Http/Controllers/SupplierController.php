<?php

namespace App\Http\Controllers;

use App\Http\Requests\SupplierRequest;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));
        $status = $validated['status'] ?? null;

        $active = match ($status) {
            'active' => true,
            'inactive' => false,
            default => null,
        };

        return Inertia::render('Suppliers/Index', [
            'suppliers' => Supplier::query()
                ->search($search)
                ->when($active !== null, fn ($query) => $query->where('is_active', $active))
                ->orderBy('name')
                ->orderBy('id')
                ->paginate(8)
                ->withQueryString(),

            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function store(SupplierRequest $request)
    {
        $this->authorize('create', Supplier::class);

        $validated = $request->validated();

        Supplier::create($validated);

        return redirect()->route('suppliers')->with('success', 'Supplier has been created');
    }

    public function update(SupplierRequest $request, Supplier $supplier)
    {
        $this->authorize('update', $supplier);

        $validated = $request->validated();

        $supplier->update($validated);

        return redirect()->route('suppliers')->with('success', 'Supplier has been updated');
    }
}
