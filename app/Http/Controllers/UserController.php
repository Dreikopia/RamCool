<?php

namespace App\Http\Controllers;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Render the user listing with each account's status.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::enum(UserStatus::class)],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));
        $status = $validated['status'] ?? null;

        return Inertia::render('Users/Index', [
            'users' => User::query()
                ->search($search)
                ->when($status, fn ($query) => $query->where('status', $status))
                ->orderBy('name')
                ->paginate(10)
                ->withQueryString(),

            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }
}
