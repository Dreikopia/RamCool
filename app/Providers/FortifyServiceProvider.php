<?php

namespace App\Providers;

use App\Http\Requests\Auth\LoginRequest as AppLoginRequest;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\LockoutResponse as LockoutResponseContract;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\Http\Requests\LoginRequest as FortifyLoginRequest;
use Laravel\Fortify\LoginRateLimiter;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(FortifyLoginRequest::class, AppLoginRequest::class);

        $this->app->singleton(LockoutResponseContract::class, function ($app) {
            return new class($app->make(LoginRateLimiter::class)) implements LockoutResponseContract
            {
                public function __construct(private LoginRateLimiter $limiter) {}

                public function toResponse($request)
                {
                    $seconds = $this->limiter->availableIn($request);

                    $message = trans('auth.throttle', [
                        'seconds' => $seconds,
                        'minutes' => ceil($seconds / 60),
                    ]);

                    if ($request->wantsJson()) {
                        return response()->json([
                            'message' => $message,
                            'retry_after' => $seconds,
                            'errors' => [
                                Fortify::username() => [$message],
                            ],
                        ], 429);
                    }

                    return redirect()
                        ->route('login')
                        ->withErrors([
                            Fortify::username() => $message,
                        ])
                        ->with('retry_after', $seconds);
                }
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Fortify::loginView(fn () => Inertia::render('Auth/Login'));
    }
}
