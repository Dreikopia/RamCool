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

it('requires authentication to list users', function () {
    $this->get(route('users'))->assertRedirect(route('login'));
});
