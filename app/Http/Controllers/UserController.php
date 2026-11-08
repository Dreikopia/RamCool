<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Render the user listing with each account's status.
     */
    public function index(): Response
    {
        return Inertia::render('Users/Index', [
            'users' => User::query()->orderBy('name')->paginate(10),
        ]);
    }
}
