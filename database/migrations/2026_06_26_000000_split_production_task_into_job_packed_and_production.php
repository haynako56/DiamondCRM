<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $affectedMethods = ['cad_casting', 'handmade', 'ring_resize', 'jewellery_repair'];

        $productionTasks = DB::table('order_tasks')
            ->where('key', 'production')
            ->whereIn('method', $affectedMethods)
            ->get();

        foreach ($productionTasks as $task) {
            // Shift all tasks after the current production task up by one sort position
            DB::table('order_tasks')
                ->where('order_id', $task->order_id)
                ->where('sort_order', '>', $task->sort_order)
                ->increment('sort_order');

            // Insert the new 'production' task (Production at Daniele) — always starts unchecked.
            // The old production tick only carried over to job_packed (packing step).
            DB::table('order_tasks')->insert([
                'order_id'    => $task->order_id,
                'method'      => $task->method,
                'sort_order'  => $task->sort_order + 1,
                'key'         => 'production',
                'label'       => 'Production at Daniele',
                'description' => match($task->method) {
                    'ring_resize'      => 'Resize and finish the ring.',
                    'jewellery_repair' => 'Carry out the repair.',
                    default            => 'In-house production and setting by Daniele.',
                },
                'is_done'     => 0,
                'is_custom'   => 0,
                'progress'    => null,
                'note'        => null,
                'task_date'   => null,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);

            // Rename the existing production task to job_packed
            DB::table('order_tasks')
                ->where('id', $task->id)
                ->update([
                    'key'         => 'job_packed',
                    'label'       => 'Job Packed to Daniele',
                    'description' => 'Pack the job and send to Daniele for production.',
                    'progress'    => null,
                    'note'        => null,
                    'updated_at'  => now(),
                ]);
        }
    }

    public function down(): void
    {
        $affectedMethods = ['cad_casting', 'handmade', 'ring_resize', 'jewellery_repair'];

        $jobPackedTasks = DB::table('order_tasks')
            ->where('key', 'job_packed')
            ->whereIn('method', $affectedMethods)
            ->get();

        foreach ($jobPackedTasks as $task) {
            // Delete the production task that was inserted after job_packed
            $productionTask = DB::table('order_tasks')
                ->where('order_id', $task->order_id)
                ->where('key', 'production')
                ->where('sort_order', $task->sort_order + 1)
                ->first();

            if ($productionTask) {
                DB::table('order_tasks')->where('id', $productionTask->id)->delete();
            }

            // Shift all tasks after job_packed back down by one
            DB::table('order_tasks')
                ->where('order_id', $task->order_id)
                ->where('sort_order', '>', $task->sort_order)
                ->decrement('sort_order');

            // Restore job_packed back to production
            DB::table('order_tasks')
                ->where('id', $task->id)
                ->update([
                    'key'         => 'production',
                    'label'       => 'Production — Daniele',
                    'description' => 'In-house production and setting.',
                    'updated_at'  => now(),
                ]);
        }
    }
};
