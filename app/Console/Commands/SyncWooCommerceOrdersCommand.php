<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:sync-woo-commerce-orders-command')]
#[Description('Command description')]
class SyncWooCommerceOrdersCommand extends Command
{
    protected $signature   = 'woocommerce:sync-orders';
    protected $description = 'Fetch all orders from WooCommerce and save them to the database.';
 
    public function handle(): void
    {
        SyncWooCommerceOrdersJob::dispatch();
 
        $this->info('Order sync has been queued successfully.');
    }
}
