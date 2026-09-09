<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $dispatchTasks = DB::table('order_tasks')
            ->where('key', 'collection_dispatch')
            ->get();

        foreach ($dispatchTasks as $dispatchTask) {
            $alreadyAdded = DB::table('order_tasks')
                ->where('order_id', $dispatchTask->order_id)
                ->where('key', 'insurance')
                ->exists();

            if ($alreadyAdded) {
                continue;
            }

            // Shift anything sitting after dispatch up by one to make room
            DB::table('order_tasks')
                ->where('order_id', $dispatchTask->order_id)
                ->where('sort_order', '>', $dispatchTask->sort_order)
                ->increment('sort_order');

            DB::table('order_tasks')->insert([
                'order_id'    => $dispatchTask->order_id,
                'method'      => $dispatchTask->method,
                'sort_order'  => $dispatchTask->sort_order + 1,
                'key'         => 'insurance',
                'label'       => 'Insurance',
                'description' => 'Arrange insurance for the finished piece.',
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

    public function down(): void
    {
        $insuranceTasks = DB::table('order_tasks')
            ->where('key', 'insurance')
            ->get();

        foreach ($insuranceTasks as $insuranceTask) {
            DB::table('order_tasks')->where('id', $insuranceTask->id)->delete();

            DB::table('order_tasks')
                ->where('order_id', $insuranceTask->order_id)
                ->where('sort_order', '>', $insuranceTask->sort_order)
                ->decrement('sort_order');
        }
    }
};
