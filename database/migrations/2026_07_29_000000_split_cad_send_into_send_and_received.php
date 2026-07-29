<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $cadSendTasks = DB::table('order_tasks')
            ->where('key', 'cad_send')
            ->get();

        foreach ($cadSendTasks as $cadSendTask) {
            // Shift all tasks after cad_send up by one to make room
            DB::table('order_tasks')
                ->where('order_id', $cadSendTask->order_id)
                ->where('sort_order', '>', $cadSendTask->sort_order)
                ->increment('sort_order');

            // Insert cad_received task — use received_date if it was already set
            DB::table('order_tasks')->insert([
                'order_id'    => $cadSendTask->order_id,
                'method'      => $cadSendTask->method,
                'sort_order'  => $cadSendTask->sort_order + 1,
                'key'         => 'cad_received',
                'label'       => 'CAD Received',
                'description' => 'Confirm CAD design file has been received.',
                'is_done'     => $cadSendTask->received_date ? 1 : 0,
                'task_date'   => $cadSendTask->received_date,
                'is_custom'   => 0,
                'progress'    => null,
                'note'        => null,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }
    }

    public function down(): void
    {
        $cadReceivedTasks = DB::table('order_tasks')
            ->where('key', 'cad_received')
            ->get();

        foreach ($cadReceivedTasks as $cadReceivedTask) {
            // Write received_date back onto the cad_send task
            DB::table('order_tasks')
                ->where('order_id', $cadReceivedTask->order_id)
                ->where('key', 'cad_send')
                ->update(['received_date' => $cadReceivedTask->task_date, 'updated_at' => now()]);

            DB::table('order_tasks')->where('id', $cadReceivedTask->id)->delete();

            // Close the sort_order gap
            DB::table('order_tasks')
                ->where('order_id', $cadReceivedTask->order_id)
                ->where('sort_order', '>', $cadReceivedTask->sort_order)
                ->decrement('sort_order');
        }
    }
};
