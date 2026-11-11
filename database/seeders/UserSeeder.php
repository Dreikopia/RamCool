<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Seed the application's users.
     */
    public function run(): void
    {
        User::query()->updateOrCreate(['email' => 'admin@test'],
            [
                'name' => 'Abrahim',
                'role' => Role::ADMIN,
                'status' => UserStatus::ACTIVE,
                'password' => 'password',
                'email_verified_at' => now(),
            ]);

        User::query()->updateOrCreate(['email' => 'staff@test'],
            [
                'name' => 'Staff',
                'role' => Role::STAFF,
                'status' => UserStatus::ACTIVE,
                'password' => 'password',
                'email_verified_at' => now(),
            ]
        );
    }
}
