<?php

namespace App\Http\Controllers;

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class ActivateAccountController extends Controller
{
    public function show(Request $request, User $user)
    {
        $this->ensurePending($user);

        return Inertia::render('Auth/ActivateAccount', [
            'email' => $user->email,
            'actionUrl' => $request->fullUrl(),
        ]);
    }

    public function store(Request $request, User $user)
    {
        $this->ensurePending($user);

        $validated = $request->validate([
            'password' => ['required', 'confirmed', Password::default()],
        ]);

        $user->forceFill([
            'password' => $validated['password'],
            'email_verified_at' => now(),
            'status' => UserStatus::ACTIVE,
        ])->save();

        return redirect()
            ->route('login')
            ->with('success', 'Your account is active. You can log in now.');
    }

    private function ensurePending(User $user)
    {
        abort_unless(
            $user->status === UserStatus::PENDING,
            403,
            'This activation link is no longer valid'
        );
    }
}
