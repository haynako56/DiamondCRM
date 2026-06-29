<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $awaitingTasks = DB::table('order_tasks')
            ->where('key', 'awaiting_collection')
            ->where('method', 'cad_casting')
            ->get();

        foreach ($awaitingTasks as $awaitingTask) {
            DB::table('order_tasks')->where('id', $awaitingTask->id)->delete();

            // Close the sort_order gap left by the deleted task
            DB::table('order_tasks')
                ->where('order_id', $awaitingTask->order_id)
                ->where('sort_order', '>', $awaitingTask->sort_order)
                ->decrement('sort_order');
        }
    }

    public function down(): void
    {
        $productionTasks = DB::table('order_tasks')
            ->where('key', 'production')
            ->where('method', 'cad_casting')
            ->get();

        foreach ($productionTasks as $productionTask) {
            DB::table('order_tasks')
                ->where('order_id', $productionTask->order_id)
                ->where('sort_order', '>', $productionTask->sort_order)
                ->increment('sort_order');

            DB::table('order_tasks')->insert([
                'order_id'    => $productionTask->order_id,
                'method'      => 'cad_casting',
                'sort_order'  => $productionTask->sort_order + 1,
                'key'         => 'awaiting_collection',
                'label'       => 'Awaiting Collection',
                'description' => 'Job is complete and ready for client collection or dispatch.',
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
