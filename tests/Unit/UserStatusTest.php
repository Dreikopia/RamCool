<?php

use App\Enums\UserStatus;
use App\Models\User;

test('user status is cast to enum', function () {
    $user = new User([
        'status' => 'active',
    ]);

    $this->assertSame(UserStatus::ACTIVE, $user->status);
    $this->assertTrue($user->isActive());
});

test('user factory defaults status to active', function () {
    $user = User::factory()->make();

    $this->assertSame(UserStatus::ACTIVE, $user->status);
    $this->assertTrue($user->isActive());
});

test('user factory pending state sets status to pending', function () {
    $user = User::factory()->pending()->make();

    $this->assertSame(UserStatus::PENDING, $user->status);
    $this->assertFalse($user->isActive());
});

test('user factory disabled state sets status to disabled', function () {
    $user = User::factory()->disabled()->make();

    $this->assertSame(UserStatus::DISABLED, $user->status);
    $this->assertFalse($user->isActive());
});
