<?php

use App\Enums\Role;
use App\Enums\UserStatus;
use App\Models\User;
use Database\Seeders\UserSeeder;
use Illuminate\Support\Facades\Hash;

afterEach(function () {
    foreach ([
        'SEED_ADMIN_NAME',
        'SEED_ADMIN_EMAIL',
        'SEED_ADMIN_PASSWORD',
        'SEED_STAFF_NAME',
        'SEED_STAFF_EMAIL',
        'SEED_STAFF_PASSWORD',
    ] as $key) {
        putenv($key);
    }
});

it('creates the admin and staff accounts from env vars', function () {
    putenv('SEED_ADMIN_NAME=Abrahim');
    putenv('SEED_ADMIN_EMAIL=admin@example.com');
    putenv('SEED_ADMIN_PASSWORD=admin-secret');
    putenv('SEED_STAFF_NAME=Staff');
    putenv('SEED_STAFF_EMAIL=staff@example.com');
    putenv('SEED_STAFF_PASSWORD=staff-secret');

    $this->seed(UserSeeder::class);

    $admin = User::query()->where('email', 'admin@example.com')->sole();

    expect($admin->name)->toBe('Abrahim')
        ->and($admin->role)->toBe(Role::ADMIN)
        ->and($admin->status)->toBe(UserStatus::ACTIVE)
        ->and(Hash::check('admin-secret', $admin->password))->toBeTrue();

    $staff = User::query()->where('email', 'staff@example.com')->sole();

    expect($staff->name)->toBe('Staff')
        ->and($staff->role)->toBe(Role::STAFF)
        ->and(Hash::check('staff-secret', $staff->password))->toBeTrue();
});

it('never resets the password of an existing account', function () {
    putenv('SEED_ADMIN_EMAIL=admin@example.com');
    putenv('SEED_ADMIN_PASSWORD=first-secret');

    $this->seed(UserSeeder::class);

    putenv('SEED_ADMIN_PASSWORD=second-secret');

    $this->seed(UserSeeder::class);

    $admin = User::query()->where('email', 'admin@example.com')->sole();

    expect(User::query()->count())->toBe(1)
        ->and(Hash::check('first-secret', $admin->password))->toBeTrue();
});

it('skips accounts when no credentials are configured', function () {
    $this->seed(UserSeeder::class);

    expect(User::query()->count())->toBe(0);
});
