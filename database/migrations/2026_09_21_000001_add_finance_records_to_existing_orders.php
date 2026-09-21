<?php

use App\Models\Order;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // createFinanceRecord() is idempotent, so this is safe to re-run
        Order::doesntHave('finance')->each(fn (Order $order) => $order->createFinanceRecord());
    }

    public function down(): void
    {
        // Dropping the tables in the create migration removes the records
    }
};
