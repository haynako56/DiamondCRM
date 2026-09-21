<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderFinance;
use App\Models\OrderFinanceCost;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinanceController extends Controller
{
    public function index(): Response
    {
        $orders = Order::with('lineItems', 'finance.costs')
            ->where('status', '!=', 'checkout-draft')
            ->latest('woocommerce_created_at')
            ->get();

        $financeJobs = $orders->map(fn (Order $order) => $this->buildFinanceShape($order));

        $totalRevenue = $financeJobs->sum('sale_price');
        $totalCosts   = $financeJobs->sum('total_cost');
        $grossProfit  = $totalRevenue - $totalCosts;

        $stats = [
            'total_revenue' => $totalRevenue,
            'total_costs'   => $totalCosts,
            'gross_profit'  => $grossProfit,
            'margin'        => $totalRevenue > 0 ? round(($grossProfit / $totalRevenue) * 100) : 0,
        ];

        return Inertia::render('finance/index', [
            'stats'     => $stats,
            'active'    => $financeJobs->filter(fn ($job) => !$job['completed'] && !$job['costings_done'])->values(),
            'completed' => $financeJobs->filter(fn ($job) => $job['completed'] && !$job['costings_done'])->values(),
            'costed'    => $financeJobs->filter(fn ($job) => $job['costings_done'])->values(),
        ]);
    }

    // Mark costings complete, or reopen them
    public function update(OrderFinance $finance, Request $request): RedirectResponse
    {
        $request->validate([
            'costings_done' => 'required|boolean',
        ]);

        $finance->update(['costings_done' => $request->costings_done]);

        Inertia::flash('toast', [
            'type'    => 'success',
            'message' => $request->costings_done ? __('Costings Marked Complete.') : __('Costings Reopened.'),
        ]);

        return back();
    }

    // Add a custom cost line to a finance record
    public function storeCost(OrderFinance $finance, Request $request): RedirectResponse
    {
        $request->validate([
            'label'    => 'required|string|max:255',
            'supplier' => 'nullable|string|max:255',
            'amount'   => 'nullable|numeric|min:0',
            'note'     => 'nullable|string|max:255',
        ]);

        $lastSortOrder = $finance->costs()->max('sort_order') ?? 0;

        $finance->costs()->create([
            'sort_order' => $lastSortOrder + 1,
            'key'        => 'custom_' . now()->timestamp,
            'label'      => $request->label,
            'supplier'   => $request->supplier,
            'amount'     => $request->amount ?? 0,
            'note'       => $request->note,
            'is_custom'  => true,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Cost Added.')]);

        return back();
    }

    // Save (lock) or edit (unlock) a cost line and its values
    public function updateCost(OrderFinanceCost $cost, Request $request): RedirectResponse
    {
        $request->validate([
            'label'    => 'sometimes|required|string|max:255',
            'supplier' => 'nullable|string|max:255',
            'amount'   => 'nullable|numeric|min:0',
            'note'     => 'nullable|string|max:255',
            'is_saved' => 'boolean',
        ]);

        $cost->update($request->only(['label', 'supplier', 'amount', 'note', 'is_saved']));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Cost Updated.')]);

        return back();
    }

    // Remove a custom cost line only — the four default lines always stay
    public function destroyCost(OrderFinanceCost $cost): RedirectResponse
    {
        abort_unless($cost->is_custom, 403, 'Only custom costs can be deleted.');

        $cost->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Cost Removed.')]);

        return back();
    }

    private function buildFinanceShape(Order $order): array
    {
        $finance   = $order->finance ?? $order->createFinanceRecord();
        $salePrice = (float) ($order->total ?? 0);
        $totalCost = $finance->totalCost();

        return [
            'finance_id'    => $finance->id,
            'order_id'      => $order->id,
            'job_id'        => $order->dg_order_code ?? 'DG-' . str_pad($order->id, 3, '0', STR_PAD_LEFT),
            'woo_id'        => $order->is_manual ? 'Manual' : '#' . $order->woocommerce_order_id,
            'client'        => $order->customerFullName(),
            'product'       => $order->is_manual
                ? ($order->product_name ?? '')
                : ($order->lineItems->first()?->product_name ?? $order->product_name ?? ''),
            'sale_price'    => $salePrice,
            'total_cost'    => $totalCost,
            'profit'        => $salePrice - $totalCost,
            'completed'     => $order->status === 'completed',
            'costings_done' => $finance->costings_done,
            'costs'         => $finance->costs->map(fn (OrderFinanceCost $cost) => [
                'id'        => $cost->id,
                'key'       => $cost->key,
                'label'     => $cost->label,
                'supplier'  => $cost->supplier ?? '',
                'amount'    => $cost->amount,
                'note'      => $cost->note ?? '',
                'is_saved'  => $cost->is_saved,
                'is_custom' => $cost->is_custom,
            ])->values()->toArray(),
        ];
    }
}
