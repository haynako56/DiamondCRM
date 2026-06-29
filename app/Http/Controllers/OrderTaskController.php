<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderTask;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderTaskController extends Controller
{
    // Update a task (mark done, set date, note, tracking)
    public function update(Order $order, OrderTask $task, Request $request): RedirectResponse
    {
        $request->validate([
            'is_done'       => 'boolean',
            'task_date'     => 'nullable|date',
            'received_date' => 'nullable|date',
            'note'          => 'nullable|string',
            'progress'      => 'nullable|string|max:255',
            'tracking_ref'  => 'nullable|string',
        ]);

        $task->update($request->only([
            'is_done',
            'task_date',
            'received_date',
            'note',
            'progress',
            'tracking_ref',
        ]));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Order Task Updated.')]);

        return back();
    }

    // Add a custom task to an order
    public function store(Order $order, Request $request): RedirectResponse
    {
        $request->validate([
            'label' => 'required|string|max:255',
            'note'  => 'nullable|string',
        ]);

        $lastSortOrder = $order->tasks()->max('sort_order') ?? 0;

        $order->tasks()->create([
            'method'     => $order->tasks()->first()?->method ?? 'cad_casting',
            'sort_order' => $lastSortOrder + 1,
            'key'        => 'custom_' . now()->timestamp,
            'label'      => $request->label,
            'note'       => $request->note,
            'is_custom'  => true,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('New Task Created.')]);

        return back();
    }

    // Delete a custom task only
    public function destroy(Order $order, OrderTask $task): RedirectResponse
    {
        abort_unless($task->is_custom, 403, 'Only custom tasks can be deleted.');

        $task->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Task Deleted.')]);

        return back();
    }
}