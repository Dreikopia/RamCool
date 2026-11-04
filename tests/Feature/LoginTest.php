<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('shows the login page', function () {
    $this->get(route('login'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Auth/Login'));
});

it('logs a user in with valid credentials', function () {
    $user = User::factory()->create(['email' => 'staff@example.com']);

    $this->post(route('login.store'), [
        'email' => 'staff@example.com',
        'password' => 'password',
    ])->assertRedirect(route('dashboard'));

    $this->assertAuthenticatedAs($user);
});

it('rejects invalid credentials', function () {
    User::factory()->create(['email' => 'staff@example.com']);

    $this->post(route('login.store'), [
        'email' => 'staff@example.com',
        'password' => 'not-the-password',
    ])->assertSessionHasErrors('email');

    $this->assertGuest();
});

it('requires an email and a password', function () {
    $this->post(route('login.store'), [])
        ->assertSessionHasErrors(['email', 'password']);

    $this->assertGuest();
});

it('redirects guests away from the dashboard', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

it('logs a user out', function () {
    $this->actingAs(User::factory()->create())
        ->post(route('logout'))
        ->assertRedirect(route('login'));

    $this->assertGuest();
});

it('throttles login after five failed attempts', function () {
    User::factory()->create(['email' => 'staff@example.com']);

    foreach (range(1, 5) as $attempt) {
        $this->post(route('login.store'), [
            'email' => 'staff@example.com',
            'password' => 'wrong-password',
        ])->assertSessionHasErrors('email');
    }

    $this->post(route('login.store'), [
        'email' => 'staff@example.com',
        'password' => 'wrong-password',
    ])
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors('email');

    expect(session('retry_after'))->toBeGreaterThan(0);
});
