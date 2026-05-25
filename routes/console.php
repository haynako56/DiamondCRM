<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('woocommerce:sync-orders', function () {
    \App\Jobs\SyncWooCommerceOrdersJob::dispatch();
})->describe('Fetch all orders from WooCommerce and save them to the database.');