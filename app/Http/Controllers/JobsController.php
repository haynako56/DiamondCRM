<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderNote;
use App\Support\OrderTaskDefinitions;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use App\Services\WooCommerceService;
use App\Models\OrderLineItem;
use App\Models\WooCommerceSetting;

class JobsController extends Controller
{
    public function index(): Response
    {
        $orders = Order::with('lineItems', 'tasks', 'orderNotes')
            ->where('status', '!=', 'checkout-draft')
            ->latest('woocommerce_created_at')
            ->get();

        $jobs = $orders->map(fn (Order $order) => $this->buildJobShape($order));

        $stats = [
            'active'      => $orders->where('status', '!=', 'completed')->count(),
            'overdue'     => 0,
            'due_soon'    => 0,
            'outstanding' => $orders->sum(fn (Order $order) => $order->amount_owing),
        ];

        return Inertia::render('jobs/index', [
            'jobs'  => $jobs,
            'stats' => $stats,
        ]);
    }

    public function show(Order $order): Response
    {
        $order->load('lineItems', 'tasks');

        return Inertia::render('jobs/show', [
            'order' => $order,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'client_name' => 'required|string|max:255',
            'product'     => 'required|string|max:255',
            'category'    => 'required|string|max:255',
            'price'       => 'required|numeric|min:0',
            'amount_paid' => 'nullable|numeric|min:0',
            'due_date'    => 'nullable|date',
        ]);

        $nameParts             = explode(' ', $request->client_name, 2);
        $billing['first_name'] = $nameParts[0] ?? '';
        $billing['last_name']  = $nameParts[1] ?? '';

        $nameParts = explode(' ', $request->client_name, 2);

        $billing = [
            'first_name' => $nameParts[0] ?? '',
            'last_name'  => $nameParts[1] ?? '',
            'email'      => '',
            'phone'      => '',
            'address_1'  => '',
            'city'       => '',
            'state'      => '',
            'postcode'   => '',
            'country'    => 'AU',
        ];

        $productionMethod = OrderTaskDefinitions::methodFromCategory($request->category);

        $order = Order::create([
            'woocommerce_order_id'   => null,
            'status'                 => 'processing',
            'currency'               => 'AUD',
            'total'                  => $request->price ?? 0,
            'amount_paid'            => $request->amount_paid ?? 0,
            'payment_method'         => 'manual',
            'payment_method_title'   => 'Manual order',
            'billing'                => $billing,
            'shipping'               => $billing,
            'woocommerce_created_at' => now(),
            'product_name'           => $request->product,
            'category'               => $request->category,
            'production_category'    => $productionMethod,
            'order_due_date'         => $request->due_date ?? now()->addWeeks(4),
            'is_manual'              => true,
            'dg_order_code'          => 'DG-' . str_pad(Order::max('id') + 1, 5, '0', STR_PAD_LEFT),
        ]);

        $order->createDefaultTasks($productionMethod);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('New Order Created.')]);

        return back();
    }

    public function update(Order $order, Request $request): RedirectResponse
    {
        $request->validate([
            'client'       => 'sometimes|string|max:255',
            'product'      => 'sometimes|nullable|string|max:255',
            'email'        => 'sometimes|nullable|email|max:255',
            'phone'        => ['sometimes', 'nullable', 'string', 'max:20', 'regex:/^[0-9\+\s\-\(\)]+$/'],
            'address'      => 'sometimes|nullable|string|max:500',
            'price'        => 'sometimes|nullable|numeric|min:0',
            'amount_paid'  => 'sometimes|nullable|numeric|min:0',
            'payment_plan' => 'sometimes|nullable|string|max:255',
            'payment_note' => 'sometimes|nullable|string',
            'status'               => 'sometimes|string|in:processing,completed,on-hold,cancelled',
            'due_date'             => 'sometimes|nullable|date',
            'woocommerce_order_id' => 'sometimes|nullable|integer',
            'is_archived'          => 'sometimes|boolean',
        ]);
 
        // Archive order
        if ($request->has('is_archived') && !$request->has('client')) {
            $order->update(['is_archived' => $request->is_archived]);

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Order Archived.')]);

            return back();
        }

        // Save payment only
        if ($request->has('price') && !$request->has('client')) {
            $order->update([
                'total'       => $request->price ?? $order->total,
                'amount_paid' => $request->amount_paid ?? $order->amount_paid,
            ]);

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment Updated.')]);

            return back();
        }

        // Save payment note only
        if ($request->has('payment_note') && !$request->has('client') && !$request->has('price')) {
            $order->update(['payment_note' => $request->payment_note]);

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Payment Note Updated.')]);

            return back();
        }

        if ($request->has('status') && !$request->has('client')) {
            $order->update(['status' => $request->status]);

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Order Completed.')]);

            return back();
        }

        if ($request->has('due_date') && !$request->has('client')) {
            $order->update(['order_due_date' => $request->due_date]);

            Inertia::flash('toast', ['type' => 'success', 'message' => __('Due Date Updated.')]);

            return back();
        }
 
        // Save order details
        $billing = $order->billing ?? [];
 
        $nameParts             = explode(' ', $request->client, 2);
        $billing['first_name'] = $nameParts[0] ?? '';
        $billing['last_name']  = $nameParts[1] ?? '';
        $billing['email']      = $request->email ?? '';
        $billing['phone']      = $request->phone ?? '';
 
        $order->update([
            'billing'              => $billing,
            'address'              => $request->address,
            'product_name'         => $request->product,
            'woocommerce_order_id' => $request->woocommerce_order_id ?? $order->woocommerce_order_id,
        ]);
 
        Inertia::flash('toast', ['type' => 'success', 'message' => __('Order Details Updated.')]);

        return back();
    }

    public function status(): Response
    {
        $orders = Order::with('lineItems', 'tasks', 'orderNotes')
            ->where('status', '!=', 'checkout-draft')
            ->where('status', '!=', 'completed')
            ->get();

        $sentToCad         = [];
        $awaitingApproval  = [];
        $danieleProduction = [];
        $awaitingCollection = [];
        $allOpen           = [];

        foreach ($orders as $order) {
            $firstLineItem     = $order->lineItems->first();
            $sortedTasks       = $order->tasks->sortBy('sort_order');
            $pendingTask       = $sortedTasks->where('is_done', false)->first();
            $productionTask    = $sortedTasks->where('key', 'production')->first();
            $cadSendTask       = $sortedTasks->where('key', 'cad_send')->first();
            $cadApproveTask    = $sortedTasks->where('key', 'cad_approve')->first();
            $castingTask       = $sortedTasks->where('key', 'casting')->first();
            $jobPackedTask     = $sortedTasks->where('key', 'job_packed')->first();
            $dispatchTask      = $sortedTasks->where('key', 'dispatch')->first();
            $returnTask        = $sortedTasks->where('key', 'return_to_client')->first();
            $awaitingCollTask  = $sortedTasks->where('key', 'awaiting_collection')->first();
            $category          = $order->production_category ?? 'cad_casting';

            $cadReceived  = $cadSendTask?->received_date !== null;
            $finalTaskDone = ($dispatchTask?->is_done || $returnTask?->is_done);

            $job = [
                'db_id'                     => $order->id,
                'id'                        => $order->dg_order_code ?? 'DG-' . str_pad($order->id, 3, '0', STR_PAD_LEFT),
                'woo_id'                    => $order->is_manual ? 'Manual' : '#' . $order->woocommerce_order_id,
                'client'                    => $order->customerFullName(),
                'product'                   => $order->is_manual
                    ? ($order->product_name ?? '')
                    : ($firstLineItem?->product_name ?? $order->product_name ?? ''),
                'stage'                     => $pendingTask?->label ?? 'Complete',
                'due_raw'                   => $order->order_due_date?->format('Y-m-d'),
                'category'                  => $category,
                'balance'                   => max(0, ($order->total ?? 0) - ($order->amount_paid ?? 0)),
                'cad_sent'                  => (bool) ($cadSendTask?->is_done ?? false),
                'cad_approved'              => (bool) ($cadApproveTask?->is_done ?? false),
                'cad_send_date'             => $cadSendTask?->task_date?->format('d M Y') ?? '',
                'cad_received_date'         => $cadSendTask?->received_date?->format('d M Y') ?? '',
                'casting_done'              => (bool) ($castingTask?->is_done ?? false),
                'job_packed_done'           => (bool) ($jobPackedTask?->is_done ?? false),
                'job_packed_date'           => $jobPackedTask?->task_date?->format('d M Y') ?? '',
                'production_progress'       => $productionTask?->progress ?? 'Not started',
                'production_done'           => (bool) ($productionTask?->is_done ?? false),
                'production_date'           => $productionTask?->task_date?->format('d M Y') ?? '',
                'cad_note'                  => $cadSendTask?->note ?? $cadApproveTask?->note ?? '',
                'production_note'           => $productionTask?->note ?? '',
                'awaiting_collection_date'  => $awaitingCollTask?->task_date?->format('d M Y') ?? '',
                'awaiting_collection_note'  => $awaitingCollTask?->note ?? '',
            ];

            // CAD boards: cad_casting orders where approval is not yet done
            if ($category === 'cad_casting' && !($cadApproveTask?->is_done)) {
                if ($cadReceived) {
                    $awaitingApproval[] = $job;
                } else {
                    $sentToCad[] = $job;
                }
            }

            // Daniele Production: show while production is NOT yet done
            if (!in_array($category, ['supplier_product', 'custom'])) {
                if (in_array($category, ['ring_resize', 'jewellery_repair', 'handmade'])) {
                    if (!($productionTask?->is_done)) {
                        $danieleProduction[] = $job;
                    }
                } elseif ($category === 'cad_casting' && $productionTask) {
                    // Show when casting is done but production not yet finished
                    $inProduction = !$productionTask->is_done && (
                        $jobPackedTask?->is_done
                        || ($productionTask->progress && $productionTask->progress !== 'Not started')
                        || $castingTask?->is_done
                    );
                    if ($inProduction) {
                        $danieleProduction[] = $job;
                    }
                }
            }

            // Awaiting Collection: production done, ring with us, not yet dispatched/returned
            if ($productionTask?->is_done && !$finalTaskDone && !in_array($category, ['supplier_product', 'custom'])) {
                $awaitingCollection[] = $job;
            }

            $allOpen[] = $job;
        }

        $sortByDue = fn ($jobA, $jobB) => strcmp($jobA['due_raw'] ?? '9999', $jobB['due_raw'] ?? '9999');
        usort($sentToCad,          $sortByDue);
        usort($awaitingApproval,   $sortByDue);
        usort($danieleProduction,  $sortByDue);
        usort($awaitingCollection, $sortByDue);
        usort($allOpen,            $sortByDue);

        $jobs = $orders->map(fn (Order $order) => $this->buildJobShape($order))->values();

        return Inertia::render('jobs/status', [
            'sent_to_cad'         => $sentToCad,
            'awaiting_approval'   => $awaitingApproval,
            'daniele_production'  => $danieleProduction,
            'awaiting_collection' => $awaitingCollection,
            'all_open'            => $allOpen,
            'jobs'                => $jobs,
        ]);
    }

    public function due(): Response
    {
        $orders = Order::with('lineItems', 'tasks')
            ->where('status', '!=', 'checkout-draft')
            ->where('status', '!=', 'completed')
            ->whereNotNull('order_due_date')
            ->orderBy('order_due_date', 'asc')
            ->get();
 
        $jobs = $orders->map(function (Order $order) {
            $firstLineItem = $order->lineItems->first();
            $pendingTask   = $order->tasks->where('is_done', false)->first();
 
            return [
                'id'      => $order->dg_order_code ?? 'DG-' . str_pad($order->id, 3, '0', STR_PAD_LEFT),
                'client'  => $order->customerFullName(),
                'product' => $order->is_manual
                    ? ($order->product_name ?? '')
                    : ($firstLineItem?->product_name ?? $order->product_name ?? ''),
                'due'     => $order->order_due_date->toDateString(),
                'stage'   => $pendingTask?->label ?? 'Complete',
                'balance' => $order->amount_owing,
            ];
        });
 
        return Inertia::render('jobs/due', [
            'jobs' => $jobs,
        ]);
    }

    public function reports(): Response
    {
        $orders = Order::with('lineItems', 'tasks', 'orderNotes')
            ->where('status', '!=', 'checkout-draft')
            ->where('status', '!=', 'completed')
            ->orderBy('order_due_date', 'asc')
            ->get();

        $today = now()->startOfDay();

        $stats = [
            'total_order_value' => $orders->sum('total'),
            'collected'         => $orders->sum('amount_paid'),
            'outstanding'       => $orders->sum(fn (Order $order) => $order->amount_owing),
            'active_jobs'       => $orders->count(),
        ];

        $weekGroups = [
            'overdue'    => ['label' => 'Overdue',    'color' => 'red',   'jobs' => []],
            'this_week'  => ['label' => 'This week',  'color' => 'amber', 'jobs' => []],
            'next_week'  => ['label' => 'Next week',  'color' => 'gray',  'jobs' => []],
            'in_2_weeks' => ['label' => 'In 2 weeks', 'color' => 'gray',  'jobs' => []],
            'in_3_weeks' => ['label' => 'In 3 weeks', 'color' => 'gray',  'jobs' => []],
            'later'      => ['label' => 'In 4+ weeks','color' => 'gray',  'jobs' => []],
            'no_date'    => ['label' => 'No due date','color' => 'gray',  'jobs' => []],
        ];

        $stageColorMap = [
            'diamonds_order'     => ['color' => '#92600A', 'bg' => '#FEF3E2'],
            'diamonds_delivered' => ['color' => '#92600A', 'bg' => '#FEF3E2'],
            'cad_send'           => ['color' => '#1A4A7A', 'bg' => '#E8F0FA'],
            'cad_approve'        => ['color' => '#1A4A7A', 'bg' => '#E8F0FA'],
            'casting'            => ['color' => '#4A3A9A', 'bg' => '#F0EDFB'],
            'job_packed'         => ['color' => '#2D6A4F', 'bg' => '#E8F4EE'],
            'production'         => ['color' => '#2D6A4F', 'bg' => '#E8F4EE'],
            'dispatch'           => ['color' => '#2D6A4F', 'bg' => '#E8F4EE'],
            'supplier_order'     => ['color' => '#92600A', 'bg' => '#FEF3E2'],
            'delivery_confirmed' => ['color' => '#92600A', 'bg' => '#FEF3E2'],
            'return_to_client'   => ['color' => '#2D6A4F', 'bg' => '#E8F4EE'],
        ];

        $stageCounts = [];

        foreach ($orders as $order) {
            $firstLineItem = $order->lineItems->first();
            $pendingTask   = $order->tasks->where('is_done', false)->sortBy('sort_order')->first();
            $taskKey       = $pendingTask?->key ?? '';
            $currentStage  = $pendingTask?->label ?? 'Complete';
            $stageStyle    = $stageColorMap[$taskKey] ?? ['color' => '#7A8C90', 'bg' => '#ECE9E3'];

            if (!isset($stageCounts[$currentStage])) {
                $stageCounts[$currentStage] = [
                    'label' => $currentStage,
                    'count' => 0,
                    'color' => $stageStyle['color'],
                    'bg'    => $stageStyle['bg'],
                ];
            }
            $stageCounts[$currentStage]['count']++;

            $job = [
                'db_id'       => $order->id,
                'id'          => $order->dg_order_code ?? 'DG-' . str_pad($order->id, 3, '0', STR_PAD_LEFT),
                'woo_id'      => $order->is_manual ? 'Manual' : '#' . $order->woocommerce_order_id,
                'client'      => $order->customerFullName(),
                'product'     => $order->is_manual
                    ? ($order->product_name ?? '')
                    : ($firstLineItem?->product_name ?? $order->product_name ?? ''),
                'stage'       => $currentStage,
                'stage_color' => $stageStyle['color'],
                'stage_bg'    => $stageStyle['bg'],
                'due'         => $order->order_due_date?->format('d M Y') ?? '',
                'due_raw'     => $order->order_due_date?->format('Y-m-d'),
                'balance'     => $order->amount_owing,
                'notes'       => $order->orderNotes->first()?->content ?? '',
            ];

            if (!$order->order_due_date) {
                $weekGroups['no_date']['jobs'][]    = $job;
            } elseif ($order->order_due_date->lt($today)) {
                $weekGroups['overdue']['jobs'][]    = $job;
            } elseif ($order->order_due_date->lt($today->copy()->addDays(7))) {
                $weekGroups['this_week']['jobs'][]  = $job;
            } elseif ($order->order_due_date->lt($today->copy()->addDays(14))) {
                $weekGroups['next_week']['jobs'][]  = $job;
            } elseif ($order->order_due_date->lt($today->copy()->addDays(21))) {
                $weekGroups['in_2_weeks']['jobs'][] = $job;
            } elseif ($order->order_due_date->lt($today->copy()->addDays(28))) {
                $weekGroups['in_3_weeks']['jobs'][] = $job;
            } else {
                $weekGroups['later']['jobs'][]      = $job;
            }
        }

        // Only send groups that have jobs
        $groups = array_values(array_filter($weekGroups, fn ($group) => count($group['jobs']) > 0));

        // Sort stage counts by count descending
        $stageSummary = array_values($stageCounts);
        usort($stageSummary, fn ($stageA, $stageB) => $stageB['count'] - $stageA['count']);

        $jobs = $orders->map(fn (Order $order) => $this->buildJobShape($order))->values();

        return Inertia::render('jobs/reports', [
            'groups'        => $groups,
            'stage_counts'  => $stageSummary,
            'stats'         => $stats,
            'daniele_email' => WooCommerceSetting::first()?->production_email ?? '',
            'jobs'          => $jobs,
        ]);
    }

    public function completed(): Response
    {
        $orders = Order::with('lineItems', 'tasks', 'orderNotes')
            ->where('status', 'completed')
            ->where('is_archived', false)
            ->latest('woocommerce_created_at')
            ->paginate(20);

        $reportJobs = $orders->getCollection()->map(function (Order $order) {
            $firstLineItem = $order->lineItems->first();
            $dispatchTask  = $order->tasks->firstWhere('key', 'dispatch')
                ?? $order->tasks->firstWhere('key', 'return_to_client');

            return [
                'db_id'               => $order->id,
                'id'                  => $order->dg_order_code ?? 'DG-' . str_pad($order->id, 3, '0', STR_PAD_LEFT),
                'woo_id'              => $order->is_manual ? 'Manual' : '#' . $order->woocommerce_order_id,
                'client'              => $order->customerFullName(),
                'email'               => $order->customerEmail(),
                'product'             => $order->is_manual
                    ? ($order->product_name ?? '')
                    : ($firstLineItem?->product_name ?? $order->product_name ?? ''),
                'production_category' => $order->production_category ?? 'cad_casting',
                'due'                 => $order->order_due_date?->format('d M Y') ?? '—',
                'total'               => $order->total,
                'balance'             => $order->amount_owing,
                'tracking'            => $dispatchTask?->tracking_ref ?? '',
                'notes'               => $order->orderNotes->first()?->content ?? '',
                'status'              => $order->status,
            ];
        });

        $fullJobs = $orders->getCollection()->map(fn (Order $order) => $this->buildJobShape($order))->values();

        $stats = [
            'total_completed' => Order::where('status', 'completed')->where('is_archived', false)->count(),
            'total_value'     => Order::where('status', 'completed')->where('is_archived', false)->sum('total'),
            'total_collected' => Order::where('status', 'completed')->where('is_archived', false)->sum('amount_paid'),
        ];

        return Inertia::render('jobs/completed', [
            'jobs'       => $reportJobs,
            'full_jobs'  => $fullJobs,
            'stats'      => $stats,
            'pagination' => [
                'current_page' => $orders->currentPage(),
                'last_page'    => $orders->lastPage(),
                'per_page'     => $orders->perPage(),
                'total'        => $orders->total(),
                'from'         => $orders->firstItem(),
                'to'           => $orders->lastItem(),
            ],
        ]);
    }

    public function reopen(Order $order): RedirectResponse
    {
        $order->update(['status' => 'processing']);

        return redirect()->route('jobs.index');
    }

    public function complete(Order $order, Request $request): RedirectResponse
    {
        $request->validate([
            'tracking_number' => 'nullable|string|max:255',
        ]);

        $dispatchTask = $order->tasks()
            ->whereIn('key', ['dispatch', 'return_to_client'])
            ->first();

        if ($dispatchTask) {
            $dispatchTask->update([
                'tracking_ref' => $request->tracking_number ?? '',
                'is_done'      => true,
                'task_date'    => now()->toDateString(),
            ]);
        }

        $order->update(['status' => 'completed']);

        return redirect()->route('jobs.completed');
    }

    public function updateProductionCategory(Order $order, Request $request): RedirectResponse
    {
        $request->validate([
            'production_category' => 'required|in:cad_casting,handmade,supplier_product,ring_resize,jewellery_repair,custom',
        ]);
 
        $productionCategory = $request->production_category;
 
        // Delete existing non-custom tasks and replace with new defaults
        $order->tasks()->where('is_custom', false)->delete();
 
        $order->update(['production_category' => $productionCategory]);
 
        $order->createDefaultTasks($productionCategory);
 
        return back();
    }

    public function sync(): RedirectResponse
    {
        $wooCommerceService = new WooCommerceService();
        $wooCommerceOrders  = $wooCommerceService->getAllOrders();
        // dd($wooCommerceOrders);
        foreach ($wooCommerceOrders as $wooCommerceOrder) {
            // Skip completed orders — no need to sync them
            if ($wooCommerceOrder['status'] === 'completed' || $wooCommerceOrder['status'] === 'checkout-draft' || $wooCommerceOrder['status'] === 'cancelled' || $wooCommerceOrder['status'] === 'failed' || $wooCommerceOrder['status'] === 'pending') {
                continue;
            }

            $this->saveOrUpdateOrder($wooCommerceOrder);
        }
 
        Inertia::flash('toast', ['type' => 'success', 'message' => __('WooCommerce Sync Complete.')]);

        return back();
    }

    private function saveOrUpdateOrder(array $wooCommerceOrder): void
    {
        $existingOrder = Order::where('woocommerce_order_id', $wooCommerceOrder['id'])->first();
        $payment       = $this->resolvePaymentFromMeta($wooCommerceOrder);

        if ($existingOrder) {
            // Order already exists — update data only, never touch tasks
            $existingOrder->update([
                'currency'               => $wooCommerceOrder['currency'],
                'total'                  => $payment['total'],
                'amount_paid'            => $payment['amount_paid'],
                'payment_method'         => $wooCommerceOrder['payment_method'],
                'payment_method_title'   => $wooCommerceOrder['payment_method_title'],
                'transaction_id'         => $wooCommerceOrder['transaction_id'] ?? null,
                'billing'                => $wooCommerceOrder['billing'],
                'shipping'               => $wooCommerceOrder['shipping'],
                'date_paid'              => $wooCommerceOrder['date_paid'],
                'woocommerce_created_at' => $wooCommerceOrder['date_created'],
                'meta_data'              => $wooCommerceOrder['meta_data'] ?? null,
            ]);

            $this->saveOrUpdateLineItems($existingOrder, $wooCommerceOrder['line_items']);

            return;
        }

        // New order — create it and set up default tasks
        $newOrder = Order::create([
            'woocommerce_order_id'   => $wooCommerceOrder['id'],
            'status'                 => $wooCommerceOrder['status'],
            'currency'               => $wooCommerceOrder['currency'],
            'total'                  => $payment['total'],
            'amount_paid'            => $payment['amount_paid'],
            'payment_method'         => $wooCommerceOrder['payment_method'],
            'payment_method_title'   => $wooCommerceOrder['payment_method_title'],
            'transaction_id'         => $wooCommerceOrder['transaction_id'] ?? null,
            'billing'                => $wooCommerceOrder['billing'],
            'shipping'               => $wooCommerceOrder['shipping'],
            'date_paid'              => $wooCommerceOrder['date_paid'],
            'woocommerce_created_at' => $wooCommerceOrder['date_created'],
            'dg_order_code'          => 'DG-' . str_pad(Order::max('id') + 1, 5, '0', STR_PAD_LEFT),
            'order_due_date'         => \Carbon\Carbon::parse($wooCommerceOrder['date_created'])->addWeeks(4),
            'production_category'    => 'cad_casting',
            'meta_data'              => $wooCommerceOrder['meta_data'] ?? null,
        ]);

        $this->saveOrUpdateLineItems($newOrder, $wooCommerceOrder['line_items']);

        $newOrder->update(['product_name' => $newOrder->lineItems()->first()?->product_name]);

        // Default to cad_casting — can be changed per order in the UI
        $newOrder->createDefaultTasks('cad_casting');
    }

    private function resolvePaymentFromMeta(array $wooCommerceOrder): array
    {
        $metaData      = $wooCommerceOrder['meta_data'] ?? [];
        $getMeta       = fn(string $key) => collect($metaData)->firstWhere('key', $key)['value'] ?? null;
        $balanceAmount = $getMeta('_balance_amount');
        $hasBalance    = $balanceAmount !== null || $getMeta('_balance_order_id') !== null;

        $total      = (float) $wooCommerceOrder['total'];
        $amountPaid = $wooCommerceOrder['date_paid'] ? $total : 0.0;

        if ($hasBalance && $balanceAmount !== null) {
            $total += (float) $balanceAmount;
            if ($getMeta('_balance_paid') === 'yes') {
                $amountPaid += (float) $balanceAmount;
            }
        }

        return ['total' => $total, 'amount_paid' => $amountPaid];
    }
 
    private function saveOrUpdateLineItems(Order $order, array $lineItems): void
    {
        foreach ($lineItems as $lineItem) {
            OrderLineItem::updateOrCreate(
                [
                    'order_id'                 => $order->id,
                    'woocommerce_line_item_id' => $lineItem['id'],
                ],
                [
                    'product_name' => $lineItem['name'],
                    'product_id'   => $lineItem['product_id'],
                    'quantity'     => $lineItem['quantity'],
                    'total'        => $lineItem['total'],
                    'image_url'    => $lineItem['image']['src'] ?? null,
                    'meta_data'    => $lineItem['meta_data'],
                ]
            );
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function buildJobShape(Order $order): array
    {
        $firstLineItem = $order->lineItems->first();

        $productName = $order->is_manual
            ? ($order->product_name ?? '')
            : ($order->product_name ?? $firstLineItem?->product_name ?? 'Unknown Product');

        $type = $order->is_manual
            ? (str_contains(strtolower($order->category ?? ''), 'jewellery') ? 'jewellery' : 'ring')
            : ($firstLineItem?->category ?? 'jewellery');

        return [
            'id'                   => $order->id,
            'job_id'               => $order->dg_order_code ?? 'DG-' . str_pad($order->id, 3, '0', STR_PAD_LEFT),
            'woo_id'               => $order->is_manual ? 'Manual' : '#' . $order->woocommerce_order_id,
            'is_manual'            => $order->is_manual,
            'type'                 => $type,
            'category'             => $order->category ?? '',
            'subtype'              => $type === 'ring' ? 'ring_cad' : 'jewellery',
            'client'               => $order->customerFullName(),
            'email'                => $order->customerEmail(),
            'phone'                => $order->customerPhone(),
            'address'              => $order->address ?? $order->billingAddress(),
            'product'              => $productName,
            'line_items'           => $order->lineItems->map(fn ($lineItem) => [
                'id'           => $lineItem->id,
                'product_name' => $lineItem->product_name,
                'category'     => $lineItem->category,
                'quantity'     => $lineItem->quantity,
                'total'        => $lineItem->total,
                'image_url'    => $lineItem->image_url,
                'meta_data'    => $lineItem->meta_data,
            ]),
            'price'                => $order->total,
            'paid'                 => $order->amount_paid,
            'owing'                => $order->amount_owing,
            'payment_type'         => 'deposit_balance',
            'payment_note'         => $order->payment_note ?? '',
            'notes'                => $order->orderNotes->map(fn (OrderNote $note) => [
                'id'         => $note->id,
                'content'    => $note->content,
                'created_at' => $note->created_at->toIso8601String(),
            ])->values()->toArray(),
            'stone_data'           => $this->buildStoneData($firstLineItem),
            'tasks'                => $order->tasks,
            'custom_tasks'         => [],
            'completed'            => $order->status === 'completed',
            'status'               => $order->status,
            'date_paid'            => $order->date_paid?->toDateString(),
            'created_at'           => $order->woocommerce_created_at->toDateString(),
            'due_date'             => $order->order_due_date?->toDateString() ?? '',
            'production_category'  => $order->production_category ?? 'cad_casting',
            'woocommerce_order_id' => $order->woocommerce_order_id,
        ];
    }

    private function buildStoneData($lineItem): ?array
    {
        if (!$lineItem) return null;
 
        $metal        = $lineItem->getMetaValue('Metal') ?? $lineItem->getMetaValue('Material');
        $carat        = $lineItem->getMetaValue('Carat');
        $clarity      = $lineItem->getMetaValue('Clarity');
        $colour       = $lineItem->getMetaValue('Colour');
        $ringSize     = $lineItem->getMetaValue('Ring Size');
        $bandWidth    = $lineItem->getMetaValue('Band Width');
        $stoneType    = $lineItem->getMetaValue('Stone Type');
        $cert         = $lineItem->getMetaValue('Certificate Number');
        $vid          = $lineItem->getMetaValue('Certificate Url');
        $symmetry     = $lineItem->getMetaValue('Symmetry');
        $cut          = $lineItem->getMetaValue('Cut Grade');
        $polish       = $lineItem->getMetaValue('Polish');
        $measurements = $lineItem->getMetaValue('Measurements');
 
        if (!$metal && !$carat && !$ringSize) return null;
 
        // If Certificate Number is a URL use it as a clickable link (cert)
        // otherwise display it as plain text (certificateNumber)
        $certIsUrl = $cert && filter_var($cert, FILTER_VALIDATE_URL);
 
        return array_filter([
            'bandWidth'         => $bandWidth,
            'carat'             => $carat,
            'colour'            => $colour,
            'polish'            => $polish,
            'stoneType'         => $stoneType,
            'ringSize'          => $ringSize,
            'measurements'      => $measurements,
            'cut'               => $cut,
            'clarity'           => $clarity,
            'symmetry'          => $symmetry,
            'material'          => $metal,
            'cert'              => $certIsUrl ? $cert : null,
            'certificateNumber' => !$certIsUrl ? $cert : null,
            'vid'               => $vid,
        ]);
    }

}