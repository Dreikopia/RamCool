<?php

use App\Enums\Role;
use App\Models\User;

test('new user defaults to staff', function () {
    $user = new User;

    $this->assertSame(Role::STAFF, $user->role);
});

test('user role is cast to enum', function () {
    $user = new User([
        'role' => 'admin',
    ]);

    $this->assertSame(Role::ADMIN, $user->role);
});

test('admin user is admin', function () {
    $user = new User([
        'role' => Role::ADMIN,
    ]);

    $this->assertTrue($user->isAdmin());
});

test('staff user is not admin', function () {
    $user = new User([
        'role' => Role::STAFF,
    ]);

    $this->assertFalse($user->isAdmin());
});

test('staff user is staff', function () {
    $user = new User([
        'role' => Role::STAFF,
    ]);

    $this->assertTrue($user->isStaff());
});

test('admin user is not staff', function () {
    $user = new User([
        'role' => Role::ADMIN,
    ]);

    $this->assertFalse($user->isStaff());
});
