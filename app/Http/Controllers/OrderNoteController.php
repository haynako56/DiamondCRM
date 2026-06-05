<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderNote;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrderNoteController extends Controller
{
    public function store(Order $order, Request $request): RedirectResponse
    {
        $request->validate([
            'content' => 'required|string',
        ]);

        $order->orderNotes()->create(['content' => $request->content]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Note Added.')]);

        return back();
    }

    public function update(Order $order, OrderNote $note, Request $request): RedirectResponse
    {
        abort_unless($note->order_id === $order->id, 403);

        $request->validate([
            'content' => 'required|string',
        ]);

        $note->update(['content' => $request->content]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Note Updated.')]);

        return back();
    }

    public function destroy(Order $order, OrderNote $note): RedirectResponse
    {
        abort_unless($note->order_id === $order->id, 403);

        $note->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Note Deleted.')]);

        return back();
    }
}
