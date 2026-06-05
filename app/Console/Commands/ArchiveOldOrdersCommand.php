<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class ArchiveOldOrdersCommand extends Command
{
    protected $signature   = 'orders:archive-old';
    protected $description = 'Archive completed orders that are older than 3 months';

    public function handle(): void
    {
        $cutoffDate = Carbon::now()->subMonths(3);

        $archivedCount = Order::where('status', 'completed')
            ->where('is_archived', false)
            ->where('woocommerce_created_at', '<', $cutoffDate)
            ->update(['is_archived' => true]);

        $this->info("Archived {$archivedCount} orders older than 3 months.");
    }
}
