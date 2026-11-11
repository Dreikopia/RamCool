<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Seed the admin and staff accounts from environment variables.
     *
     * This runs on every container start, so it only creates missing users:
     * an existing account's password is never overwritten.
     */
    public function run(): void
    {
        $this->seedUser(
            Role::ADMIN,
            env('SEED_ADMIN_NAME', 'Admin'),
            env('SEED_ADMIN_EMAIL'),
            env('SEED_ADMIN_PASSWORD'),
        );

        $this->seedUser(
            Role::STAFF,
            env('SEED_STAFF_NAME', 'Staff'),
            env('SEED_STAFF_EMAIL'),
            env('SEED_STAFF_PASSWORD'),
        );
    }

    private function seedUser(Role $role, ?string $name, ?string $email, ?string $password): void
    {
        $email = trim((string) $email);

        if ($email === '' || blank($password)) {
            $this->command?->warn("Skipping {$role->value}: SEED_{$role->value}_EMAIL and SEED_{$role->value}_PASSWORD must be set.");

            return;
        }

        User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => $name ?: $email,
                'role' => $role,
                'status' => UserStatus::ACTIVE,
                'password' => $password,
                'email_verified_at' => now(),
            ],
        );
    }
}
