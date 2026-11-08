<?php

use App\Enums\UserStatus;
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

it('rejects pending users', function () {
    User::factory()->pending()->create(['email' => 'pending@example.com']);

    $this->post(route('login.store'), [
        'email' => 'pending@example.com',
        'password' => 'password',
    ])->assertSessionHasErrors([
        'email' => 'Your account is not active. Please contact an administrator.',
    ]);

    $this->assertGuest();
});

it('rejects disabled users', function () {
    User::factory()->disabled()->create(['email' => 'disabled@example.com']);

    $this->post(route('login.store'), [
        'email' => 'disabled@example.com',
        'password' => 'password',
    ])->assertSessionHasErrors('email');

    $this->assertGuest();
});

it('rejects users without a password', function () {
    User::factory()->pending()->create(['email' => 'no-password@example.com', 'password' => null]);

    $this->post(route('login.store'), [
        'email' => 'no-password@example.com',
        'password' => 'password',
    ])->assertSessionHasErrors('email');

    $this->assertGuest();
});

it('logs out a user whose account becomes inactive', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();

    $user->update(['status' => UserStatus::DISABLED]);

    $this->get(route('dashboard'))
        ->assertRedirect(route('login'))
        ->assertSessionHasErrors('email');

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
