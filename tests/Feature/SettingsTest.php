<?php

use App\Enums\Role;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

it('requires authentication to view settings', function () {
    $this->get(route('settings'))->assertRedirect(route('login'));
});

it('lets staff and admins view their own settings', function (Role $role) {
    $user = User::factory()->create([
        'name' => 'Settings User',
        'email' => 'settings@example.com',
        'role' => $role,
    ]);

    $this->actingAs($user)
        ->get(route('settings'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Settings/Index')
            ->where('account.name', 'Settings User')
            ->where('account.email', 'settings@example.com')
            ->where('account.role', $role->value)
            ->where('account.status', UserStatus::ACTIVE->value)
        );
})->with([Role::STAFF, Role::ADMIN]);

it('updates the authenticated user profile without changing role or status', function () {
    Notification::fake();

    $user = User::factory()->create();
    $other = User::factory()->create(['name' => 'Other User', 'email' => 'other@example.com']);

    $this->actingAs($user)
        ->patch(route('settings.profile.update'), [
            'name' => 'Updated Name',
            'email' => 'UPDATED@Example.com',
            'user_id' => $other->id,
            'role' => Role::ADMIN->value,
            'status' => UserStatus::DISABLED->value,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $user->refresh();

    expect($user->name)->toBe('Updated Name')
        ->and($user->email)->toBe('updated@example.com')
        ->and($user->role)->toBe(Role::STAFF)
        ->and($user->status)->toBe(UserStatus::ACTIVE)
        ->and($other->fresh()->name)->toBe('Other User');
});

it('rejects a profile email that belongs to another user', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $user = User::factory()->create(['email' => 'mine@example.com']);

    $this->actingAs($user)
        ->patch(route('settings.profile.update'), [
            'name' => $user->name,
            'email' => 'taken@example.com',
        ])
        ->assertSessionHasErrors('email');

    expect($user->fresh()->email)->toBe('mine@example.com');
});

it('requires a name and valid email to update the profile', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('settings.profile.update'), [
            'name' => '',
            'email' => 'not-an-email',
        ])
        ->assertSessionHasErrors(['name', 'email']);
});

it('updates the password when the current password is correct', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->put(route('settings.password.update'), [
            'current_password' => 'password',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect(Hash::check('new-password-123', $user->fresh()->password))->toBeTrue();
});

it('rejects a password change when the current password is wrong', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->put(route('settings.password.update'), [
            'current_password' => 'wrong-password',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ])
        ->assertSessionHasErrors('current_password');

    expect(Hash::check('password', $user->fresh()->password))->toBeTrue();
});

it('requires a matching confirmed password', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->put(route('settings.password.update'), [
            'current_password' => 'password',
            'password' => 'new-password-123',
            'password_confirmation' => 'different-password',
        ])
        ->assertSessionHasErrors('password');
});
