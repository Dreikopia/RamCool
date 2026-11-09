<?php

use App\Enums\Role;
use App\Enums\UserStatus;
use App\Models\User;
use App\Notifications\ActivateAccountNotification;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\SendQueuedNotifications;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;

it('lists users with their status', function () {
    $admin = User::factory()->create(['name' => 'Admin User', 'role' => Role::ADMIN]);
    User::factory()->create(['name' => 'Pending Pat', 'status' => UserStatus::PENDING]);

    $this->actingAs($admin)
        ->get(route('users'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Users/Index')
            ->has('users.data', 2)
            ->where('users.data', fn ($users) => collect($users)
                ->firstWhere('name', 'Pending Pat')['status'] === 'pending'
            )
        );
});

it('filters users by search and status', function () {
    $admin = User::factory()->create(['name' => 'Admin User', 'role' => Role::ADMIN, 'status' => UserStatus::ACTIVE]);
    User::factory()->create(['name' => 'Pending Pat', 'status' => UserStatus::PENDING]);
    User::factory()->create(['name' => 'Pending Sam', 'status' => UserStatus::PENDING]);

    $this->actingAs($admin)
        ->get(route('users', ['search' => 'Pat', 'status' => 'pending']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('users.data', 1)
            ->where('users.data.0.name', 'Pending Pat')
            ->where('filters.search', 'Pat')
            ->where('filters.status', 'pending')
        );
});

it('rejects an unknown status filter', function () {
    $this->actingAs(User::factory()->create(['role' => Role::ADMIN]))
        ->get(route('users', ['status' => 'banned']))
        ->assertSessionHasErrors('status');
});

it('requires authentication to list users', function () {
    $this->get(route('users'))->assertRedirect(route('login'));
});

it('lets an admin create a pending user and sends an activation email', function () {
    Notification::fake();

    $admin = User::factory()->create(['role' => Role::ADMIN]);

    $this->actingAs($admin)
        ->post(route('users.store'), [
            'name' => 'New Person',
            'email' => 'new@example.com',
            'role' => Role::STAFF->value,
            'password' => 'should-be-ignored',
            'status' => UserStatus::ACTIVE->value,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $user = User::where('email', 'new@example.com')->firstOrFail();

    expect($user->status)->toBe(UserStatus::PENDING)
        ->and($user->password)->toBeNull()
        ->and($user->role)->toBe(Role::STAFF);

    Notification::assertSentTo($user, ActivateAccountNotification::class);
});

it('queues the activation email instead of sending it during the request', function () {
    Queue::fake();

    $this->actingAs(User::factory()->create(['role' => Role::ADMIN]))
        ->post(route('users.store'), [
            'name' => 'New Person',
            'email' => 'new@example.com',
            'role' => Role::STAFF->value,
        ])
        ->assertRedirect();

    Queue::assertPushed(SendQueuedNotifications::class);
});

it('forbids staff from creating users', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('users.store'), [
            'name' => 'New Person',
            'email' => 'new@example.com',
            'role' => Role::STAFF->value,
        ])
        ->assertForbidden();

    expect(User::where('email', 'new@example.com')->exists())->toBeFalse();
});

it('requires authentication to create users', function () {
    $this->post(route('users.store'))->assertRedirect(route('login'));
});

it('rejects a duplicate email when creating a user', function () {
    $admin = User::factory()->create(['role' => Role::ADMIN]);
    User::factory()->create(['email' => 'taken@example.com']);

    $this->actingAs($admin)
        ->post(route('users.store'), [
            'name' => 'New Person',
            'email' => 'taken@example.com',
            'role' => Role::STAFF->value,
        ])
        ->assertSessionHasErrors('email');
});

it('updates a user and normalizes their email', function () {
    Notification::fake();

    $admin = User::factory()->create(['role' => Role::ADMIN]);
    $user = User::factory()->create([
        'name' => 'Old Name',
        'email' => 'old@example.com',
        'role' => Role::STAFF,
    ]);

    $this->actingAs($admin)
        ->patch(route('users.update', $user), [
            'name' => 'New Name',
            'email' => 'New@Example.COM',
            'role' => Role::ADMIN->value,
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($user->fresh()->name)->toBe('New Name')
        ->and($user->fresh()->email)->toBe('new@example.com')
        ->and($user->fresh()->role)->toBe(Role::ADMIN);
});

it('requires a name when updating a user', function () {
    $admin = User::factory()->create(['role' => Role::ADMIN]);
    $user = User::factory()->create(['name' => 'Keep Me']);

    $this->actingAs($admin)
        ->patch(route('users.update', $user), [
            'name' => '   ',
            'email' => $user->email,
            'role' => $user->role->value,
        ])
        ->assertSessionHasErrors('name');

    expect($user->fresh()->name)->toBe('Keep Me');
});

it('forbids staff from updating users', function () {
    $staff = User::factory()->create(['role' => Role::STAFF]);
    $user = User::factory()->create(['name' => 'Target']);

    $this->actingAs($staff)
        ->patch(route('users.update', $user), [
            'name' => 'Changed',
            'email' => $user->email,
            'role' => $user->role->value,
        ])
        ->assertForbidden();

    expect($user->fresh()->name)->toBe('Target');
});

it('rejects a duplicate email when updating a user', function () {
    $admin = User::factory()->create(['role' => Role::ADMIN]);
    User::factory()->create(['email' => 'taken@example.com']);
    $user = User::factory()->create();

    $this->actingAs($admin)
        ->patch(route('users.update', $user), [
            'name' => $user->name,
            'email' => 'taken@example.com',
            'role' => $user->role->value,
        ])
        ->assertSessionHasErrors('email');
});

it('keeps the current email without re-verifying it', function () {
    Notification::fake();

    $admin = User::factory()->create(['role' => Role::ADMIN]);
    $user = User::factory()->create(['email' => 'same@example.com']);

    $this->actingAs($admin)
        ->patch(route('users.update', $user), [
            'name' => $user->name,
            'email' => 'same@example.com',
            'role' => $user->role->value,
        ])
        ->assertSessionHasNoErrors();

    expect($user->fresh()->email_verified_at)->not->toBeNull();
    Notification::assertNothingSent();
});

it('prevents an admin from changing their own role', function () {
    $admin = User::factory()->create(['role' => Role::ADMIN]);

    $this->actingAs($admin)
        ->patch(route('users.update', $admin), [
            'name' => $admin->name,
            'email' => $admin->email,
            'role' => Role::STAFF->value,
        ])
        ->assertSessionHasErrors('role');

    expect($admin->fresh()->role)->toBe(Role::ADMIN);
});

it('marks a changed email unverified and sends a verification email to active users', function () {
    Notification::fake();

    $admin = User::factory()->create(['role' => Role::ADMIN]);
    $user = User::factory()->create(['email' => 'old@example.com']);

    $this->actingAs($admin)
        ->patch(route('users.update', $user), [
            'name' => $user->name,
            'email' => 'new@example.com',
            'role' => $user->role->value,
        ])
        ->assertSessionHasNoErrors();

    expect($user->fresh()->email_verified_at)->toBeNull();
    Notification::assertSentTo($user, VerifyEmail::class);
});

it('resends the activation email when a pending user email changes', function () {
    Notification::fake();

    $admin = User::factory()->create(['role' => Role::ADMIN]);
    $user = User::factory()->pending()->create(['email' => 'old@example.com']);

    $this->actingAs($admin)
        ->patch(route('users.update', $user), [
            'name' => $user->name,
            'email' => 'new@example.com',
            'role' => $user->role->value,
        ])
        ->assertSessionHasNoErrors();

    Notification::assertSentTo($user, ActivateAccountNotification::class);
    Notification::assertNotSentTo($user, VerifyEmail::class);
});
