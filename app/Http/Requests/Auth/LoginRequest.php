<?php

namespace App\Http\Requests\Auth;

use Laravel\Fortify\Fortify;
use Laravel\Fortify\Http\Requests\LoginRequest as FortifyLoginRequest;
use Override;

class LoginRequest extends FortifyLoginRequest
{
    #[Override]
    public function rules(): array
    {
        return [
            Fortify::username() => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['sometimes'],
        ];
    }

    #[Override]
    public function messages(): array
    {
        return [
            'email.required' => 'Please enter your email address.',
            'email.email' => 'Please enter a valid email address.',
            'password.required' => 'Please enter your password.',
        ];
    }
}
