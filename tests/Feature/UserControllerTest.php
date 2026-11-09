<?php

use App\Enums\Role;
use App\Enums\UserStatus;
use App\Models\User;
use App\Notifications\ActivateAccountNotification;
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
