<?php

use App\Enums\UserStatus;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('lists users with their status', function () {
    $admin = User::factory()->create(['name' => 'Admin User']);
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
    $admin = User::factory()->create(['name' => 'Admin User', 'status' => UserStatus::ACTIVE]);
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
    $this->actingAs(User::factory()->create())
        ->get(route('users', ['status' => 'banned']))
        ->assertSessionHasErrors('status');
});

it('requires authentication to list users', function () {
    $this->get(route('users'))->assertRedirect(route('login'));
});
