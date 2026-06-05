<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Artisan::command('woocommerce:sync-orders', function () {
//     \App\Jobs\SyncWooCommerceOrdersJob::dispatch();
// })->describe('Fetch all orders from WooCommerce and save them to the database.');

Schedule::command('woocommerce:sync-orders')->hourly();
Schedule::command('orders:archive-old')->monthly();