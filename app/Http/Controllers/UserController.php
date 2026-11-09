<?php

namespace App\Http\Controllers;

use App\Enums\UserStatus;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Notifications\ActivateAccountNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                ...$request->validated(),
                'status' => UserStatus::PENDING,
            ]);

            $user->notify((new ActivateAccountNotification)->afterCommit());

            return $user;
        });

        return back()->with('success', "Activation email sent to {$user->email}.");
    }

    public function update(UpdateUserReUpdaquest $request, User $user)
    {
        $user->update($request->validated());

        return back()->with('success', 'User updated');
    }
}
