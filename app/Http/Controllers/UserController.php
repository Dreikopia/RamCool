<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Enums\UserStatus;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Notifications\ActivateAccountNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
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

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();
        $newRole = Role::from($validated['role']);
        $emailChanged = $validated['email'] !== $user->email;

        if ($request->user()->is($user) && $newRole !== $user->role) {
            throw ValidationException::withMessages([
                'role' => 'You cannot change your own role.',
            ]);
        }

        if ($emailChanged) {
            $validated['email_verified_at'] = null;
        }

        DB::transaction(function () use ($user, $validated, $newRole): void {
            if ($user->isAdmin() && $user->isActive() && $newRole !== Role::ADMIN) {
                $activeAdmins = User::query()
                    ->where('role', Role::ADMIN)
                    ->where('status', UserStatus::ACTIVE)
                    ->lockForUpdate()
                    ->count();

                if ($activeAdmins <= 1) {
                    throw ValidationException::withMessages([
                        'role' => 'You cannot remove the last active admin.',
                    ]);
                }
            }

            $user->forceFill($validated)->save();
        });

        if ($emailChanged) {
            match ($user->status) {
                UserStatus::PENDING => $user->notify((new ActivateAccountNotification)->afterCommit()),
                UserStatus::ACTIVE => $user->sendEmailVerificationNotification(),
                default => null,
            };
        }

        return back()->with('success', 'User has been updated');
    }
}
