<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // The final step key per method — awaiting_collection slots in just before it
    private array $finalStepKey = [
        'cad_casting'      => 'dispatch',
        'handmade'         => 'dispatch',
        'ring_resize'      => 'return_to_client',
        'jewellery_repair' => 'return_to_client',
    ];

    public function up(): void
    {
        foreach ($this->finalStepKey as $method => $finalKey) {
            // Orders using this method that don't already have awaiting_collection
            $orderIds = DB::table('order_tasks')
                ->where('method', $method)
                ->where('key', $finalKey)
                ->whereNotExists(function ($query) {
                    $query->select(DB::raw(1))
                        ->from('order_tasks as existing')
                        ->whereColumn('existing.order_id', 'order_tasks.order_id')
                        ->where('existing.key', 'awaiting_collection');
                })
                ->pluck('order_id');

            foreach ($orderIds as $orderId) {
                $finalSortOrder = DB::table('order_tasks')
                    ->where('order_id', $orderId)
                    ->where('key', $finalKey)
                    ->value('sort_order');

                // Shift the final step (and anything after) up by 1 to make room
                DB::table('order_tasks')
                    ->where('order_id', $orderId)
                    ->where('sort_order', '>=', $finalSortOrder)
                    ->increment('sort_order');

                DB::table('order_tasks')->insert([
                    'order_id'    => $orderId,
                    'method'      => $method,
                    'sort_order'  => $finalSortOrder,
                    'key'         => 'awaiting_collection',
                    'label'       => 'Awaiting collection',
                    'description' => 'Ring is complete and waiting with us for client pickup.',
                    'is_done'     => false,
                    'is_custom'   => false,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('order_tasks')->where('key', 'awaiting_collection')->delete();
    }
};
