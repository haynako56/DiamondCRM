<?php

namespace App\Providers;

use App\Services\WooCommerceService;
use Illuminate\Support\ServiceProvider;

class WooCommerceServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(WooCommerceService::class, function () {
            return new WooCommerceService();
        });
    }

    public function boot(): void {}
}