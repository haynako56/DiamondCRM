<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // For cad_casting and handmade: awaiting_collection + dispatch → collection_dispatch
        // For ring_resize and jewellery_repair: awaiting_collection + return_to_client → collection_dispatch
        // For supplier_product: dispatch → collection_dispatch

        $this->mergeAwaitingCollectionAndFollowUp(['cad_casting', 'handmade'], 'dispatch');
        $this->mergeAwaitingCollectionAndFollowUp(['ring_resize', 'jewellery_repair'], 'return_to_client');
        $this->renameDispatchForSupplier();
    }

    private function mergeAwaitingCollectionAndFollowUp(array $methods, string $followUpKey): void
    {
        $awaitingTasks = DB::table('order_tasks')
            ->where('key', 'awaiting_collection')
            ->whereIn('method', $methods)
            ->get();

        foreach ($awaitingTasks as $awaitingTask) {
            // Rename awaiting_collection → collection_dispatch, preserving is_done and task_date
            DB::table('order_tasks')
                ->where('id', $awaitingTask->id)
                ->update([
                    'key'         => 'collection_dispatch',
                    'label'       => 'Collection / Dispatch',
                    'description' => 'Collect from showroom or dispatch to client.',
                    'updated_at'  => now(),
                ]);

            // Delete the follow-up task (dispatch or return_to_client) for this order
            DB::table('order_tasks')
                ->where('order_id', $awaitingTask->order_id)
                ->where('key', $followUpKey)
                ->delete();

            // Close any sort_order gaps left by the deleted task
            DB::table('order_tasks')
                ->where('order_id', $awaitingTask->order_id)
                ->where('sort_order', '>', $awaitingTask->sort_order)
                ->decrement('sort_order');
        }
    }

    private function renameDispatchForSupplier(): void
    {
        DB::table('order_tasks')
            ->where('key', 'dispatch')
            ->where('method', 'supplier_product')
            ->update([
                'key'         => 'collection_dispatch',
                'label'       => 'Collection / Dispatch',
                'description' => 'Collect from showroom or dispatch to client.',
                'updated_at'  => now(),
            ]);
    }

    public function down(): void
    {
        // Reverse: collection_dispatch → awaiting_collection + dispatch/return_to_client

        $collectionTasks = DB::table('order_tasks')
            ->where('key', 'collection_dispatch')
            ->get();

        foreach ($collectionTasks as $collectionTask) {
            $method = $collectionTask->method;

            if ($method === 'supplier_product') {
                DB::table('order_tasks')
                    ->where('id', $collectionTask->id)
                    ->update([
                        'key'         => 'dispatch',
                        'label'       => 'Dispatch to client',
                        'description' => 'Send with tracking or arrange pickup.',
                        'updated_at'  => now(),
                    ]);
                continue;
            }

            $followUpKey   = in_array($method, ['ring_resize', 'jewellery_repair']) ? 'return_to_client' : 'dispatch';
            $followUpLabel = in_array($method, ['ring_resize', 'jewellery_repair']) ? 'Return to client' : 'Dispatch to client';

            // Shift tasks after this task up by one to make room for the restored follow-up
            DB::table('order_tasks')
                ->where('order_id', $collectionTask->order_id)
                ->where('sort_order', '>', $collectionTask->sort_order)
                ->increment('sort_order');

            // Restore awaiting_collection
            DB::table('order_tasks')
                ->where('id', $collectionTask->id)
                ->update([
                    'key'         => 'awaiting_collection',
                    'label'       => 'Awaiting collection',
                    'description' => 'Ring is complete and waiting with us for client pickup.',
                    'updated_at'  => now(),
                ]);

            // Re-insert the follow-up task
            DB::table('order_tasks')->insert([
                'order_id'    => $collectionTask->order_id,
                'method'      => $method,
                'sort_order'  => $collectionTask->sort_order + 1,
                'key'         => $followUpKey,
                'label'       => $followUpLabel,
                'description' => in_array($method, ['ring_resize', 'jewellery_repair'])
                    ? 'Return the completed item to the client.'
                    : 'Send with tracking or arrange pickup.',
                'is_done'     => 0,
                'is_custom'   => 0,
                'progress'    => null,
                'note'        => null,
                'task_date'   => null,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }
    }
};
