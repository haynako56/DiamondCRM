<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->text('content');
            $table->timestamps();
        });

        // Migrate existing single-note strings to the new table
        DB::table('orders')
            ->whereNotNull('notes')
            ->where('notes', '!=', '')
            ->get(['id', 'notes', 'woocommerce_created_at'])
            ->each(function ($order) {
                DB::table('order_notes')->insert([
                    'order_id'   => $order->id,
                    'content'    => $order->notes,
                    'created_at' => $order->woocommerce_created_at ?? now(),
                    'updated_at' => now(),
                ]);
            });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('notes');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->text('notes')->nullable();
        });

        Schema::dropIfExists('order_notes');
    }
};
