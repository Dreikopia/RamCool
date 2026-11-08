<?php

use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

function activationUrl(User $user): string
{
    return URL::temporarySignedRoute(
        'account.activate.show',
        now()->addHour(),
        ['user' => $user->getKey()],
    );
}

it('shows the activation form for a pending user', function () {
    $user = User::factory()->pending()->create(['password' => null]);

    $this->get(activationUrl($user))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Auth/ActivateAccount')
            ->where('email', $user->email)
            ->where('actionUrl', fn ($url) => str_contains($url, 'signature='))
        );
});

it('rejects an unsigned activation link', function () {
    $user = User::factory()->pending()->create(['password' => null]);

    $this->get(route('account.activate.show', $user))->assertForbidden();
});

it('rejects an expired activation link', function () {
    $user = User::factory()->pending()->create(['password' => null]);
    $url = activationUrl($user);

    $this->travel(49)->hours();

    $this->get($url)->assertForbidden();
});

it('activates the account and stores the new password', function () {
    $user = User::factory()->pending()->create(['password' => null]);

    $this->post(activationUrl($user), [
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])
        ->assertRedirect(route('login'))
        ->assertSessionHas('success');

    $user->refresh();

    expect($user->status)->toBe(UserStatus::ACTIVE)
        ->and($user->email_verified_at)->not->toBeNull()
        ->and(Hash::check('new-password', $user->password))->toBeTrue();
});

it('rejects mismatched password confirmation', function () {
    $user = User::factory()->pending()->create(['password' => null]);

    $this->post(activationUrl($user), [
        'password' => 'new-password',
        'password_confirmation' => 'different-password',
    ])->assertSessionHasErrors('password');

    expect($user->refresh()->status)->toBe(UserStatus::PENDING)
        ->and($user->password)->toBeNull();
});

it('rejects an activation link that was already used', function () {
    $user = User::factory()->create();
    $url = activationUrl($user);

    $this->get($url)->assertForbidden();
    $this->post($url, [
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ])->assertForbidden();
});

it('rejects activation for a disabled user', function () {
    $user = User::factory()->disabled()->create();

    $this->get(activationUrl($user))->assertForbidden();
});
