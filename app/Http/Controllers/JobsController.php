<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Support\OrderTaskDefinitions;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use App\Services\WooCommerceService;
use App\Models\OrderLineItem;

class JobsController extends Controller
{
    public function index(): Response
    {
        $orders = Order::with('lineItems', 'tasks')
            ->where('status', '!=', 'checkout-draft')
            ->latest('woocommerce_created_at')
            ->get();

        $jobs = $orders->map(function (Order $order) {
            $firstLineItem = $order->lineItems->first();

            // Manual orders use product_name and category from the order itself
            $productName = $order->is_manual
                ? ($order->product_name ?? '')
                : ($order->product_name ?? $firstLineItem?->product_name ?? 'Unknown Product');

            $type = $order->is_manual
                ? (str_contains(strtolower($order->category ?? ''), 'jewellery') ? 'jewellery' : 'ring')
                : ($firstLineItem?->category ?? 'jewellery');

            return [
                'id'            => $order->id,
                'job_id'        => $order->dg_order_code ?? 'DG-' . str_pad($order->id, 3, '0', STR_PAD_LEFT),
                'woo_id' => $order->is_manual ? 'Manual' : '#' . $order->woocommerce_order_id,
                'is_manual'     => $order->is_manual,
                'type'          => $type,
                'category'      => $order->category ?? '',
                'subtype'       => $type === 'ring' ? 'ring_cad' : 'jewellery',
                'client'        => $order->customerFullName(),
                'email'         => $order->customerEmail(),
                'phone'         => $order->customerPhone(),
                'address'       => $order->address ?? $order->billingAddress(),
                'product'       => $productName,
                'line_items'    => $order->lineItems->map(fn ($lineItem) => [
                    'id'           => $lineItem->id,
                    'product_name' => $lineItem->product_name,
                    'category'     => $lineItem->category,
                    'quantity'     => $lineItem->quantity,
                    'total'        => $lineItem->total,
                    'image_url'    => $lineItem->image_url,
                    'meta_data'    => $lineItem->meta_data,
                ]),
                'price'         => $order->total,
                'paid'          => $order->amount_paid,
                'owing'         => $order->amount_owing,
                'payment_type'  => 'deposit_balance',
                'payment_note'  => $order->payment_note ?? '',
                'notes'         => $order->notes ?? '',
                'stone_data'    => $this->buildStoneData($firstLineItem),
                'tasks'         => $order->tasks,
                'custom_tasks'  => [],
                'completed'     => $order->status === 'completed',
                'status'        => $order->status,
                'date_paid'     => $order->date_paid?->toDateString(),
                'created_at'    => $order->woocommerce_created_at->toDateString(),
                'due_date'      => $order->order_due_date?->toDateString() ?? '',
                'production_category' => $order->production_category ?? 'cad_casting',
            ];
        });

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
            'notes'        => 'sometimes|nullable|string',
            'price'        => 'sometimes|nullable|numeric|min:0',
            'amount_paid'  => 'sometimes|nullable|numeric|min:0',
            'payment_plan' => 'sometimes|nullable|string|max:255',
            'payment_note' => 'sometimes|nullable|string',
        ]);
 
        // Save notes only
        if ($request->has('notes') && !$request->has('client') && !$request->has('price')) {
            $order->update(['notes' => $request->notes]);
            return back();
        }
 
        // Save payment only
        if ($request->has('price') && !$request->has('client')) {
            $order->update([
                'total'       => $request->price ?? $order->total,
                'amount_paid' => $request->amount_paid ?? $order->amount_paid,
            ]);
            return back();
        }

        // Save payment note only
        if ($request->has('payment_note') && !$request->has('client') && !$request->has('price')) {
            $order->update(['payment_note' => $request->payment_note]);
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
            'billing'      => $billing,
            'address'      => $request->address,
            'product_name' => $request->product,
        ]);
 
        return back();
    }

    public function due(): Response
    {
        return Inertia::render('jobs/due', []);
    }

    public function reports(Request $request): Response
    {
        $perPage = 20;
 
        // Stats are calculated across ALL orders — not just the current page
        $allOrders = Order::where('status', '!=', 'checkout-draft')->get();
 
        $stats = [
            'total_order_value' => $allOrders->sum('total'),
            'collected'         => $allOrders->sum('amount_paid'),
            'outstanding'       => $allOrders->sum(fn (Order $order) => $order->amount_owing),
            'active_jobs'       => $allOrders->where('status', '!=', 'completed')->count(),
        ];
 
        // Paginate the orders for the table
        $paginated = Order::with('lineItems', 'tasks')
            ->where('status', '!=', 'checkout-draft')
            ->latest('woocommerce_created_at')
            ->paginate($perPage);
 
        $reportJobs = $paginated->getCollection()->map(function (Order $order) {
            $firstLineItem = $order->lineItems->first();
            $pendingTasks  = $order->tasks->where('is_done', false);
            $currentStage  = $pendingTasks->first()?->label ?? 'Complete';
 
            return [
                'id'      => $order->dg_order_code ?? 'DG-' . str_pad($order->id, 3, '0', STR_PAD_LEFT),
                'woo_id'  => $order->is_manual ? 'Manual' : '#' . $order->woocommerce_order_id,
                'client'  => $order->customerFullName(),
                'product' => $order->is_manual
                    ? ($order->product_name ?? '')
                    : ($firstLineItem?->product_name ?? $order->product_name ?? ''),
                'stage'   => $currentStage,
                'due'     => $order->order_due_date?->format('d M Y') ?? '—',
                'balance' => $order->amount_owing,
                'notes'   => $order->notes ?? '',
                'status'  => $order->status,
            ];
        });
 
        return Inertia::render('jobs/reports', [
            'jobs'  => $reportJobs,
            'stats' => $stats,
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
                'from'         => $paginated->firstItem(),
                'to'           => $paginated->lastItem(),
            ],
        ]);
    }

    public function updateProductionCategory(Order $order, Request $request): RedirectResponse
    {
        $request->validate([
            'production_category' => 'required|in:cad_casting,handmade,supplier_product,custom',
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
 
        foreach ($wooCommerceOrders as $wooCommerceOrder) {
            $this->saveOrUpdateOrder($wooCommerceOrder);
        }
 
        return back();
    }

    private function saveOrUpdateOrder(array $wooCommerceOrder): void
    {
        $existingOrder = Order::where('woocommerce_order_id', $wooCommerceOrder['id'])->first();
 
        if ($existingOrder) {
            // Order already exists — update data only, never touch tasks
            $existingOrder->update([
                'status'                 => $wooCommerceOrder['status'],
                'currency'               => $wooCommerceOrder['currency'],
                'total'                  => $wooCommerceOrder['total'],
                'amount_paid'            => $wooCommerceOrder['date_paid'] ? $wooCommerceOrder['total'] : 0,
                'payment_method'         => $wooCommerceOrder['payment_method'],
                'payment_method_title'   => $wooCommerceOrder['payment_method_title'],
                'transaction_id'         => $wooCommerceOrder['transaction_id'] ?? null,
                'billing'                => $wooCommerceOrder['billing'],
                'shipping'               => $wooCommerceOrder['shipping'],
                'date_paid'              => $wooCommerceOrder['date_paid'],
                'woocommerce_created_at' => $wooCommerceOrder['date_created'],
            ]);
 
            $this->saveOrUpdateLineItems($existingOrder, $wooCommerceOrder['line_items']);
 
            return;
        }
 
        // New order — create it and set up default tasks
        $newOrder = Order::create([
            'woocommerce_order_id'   => $wooCommerceOrder['id'],
            'status'                 => $wooCommerceOrder['status'],
            'currency'               => $wooCommerceOrder['currency'],
            'total'                  => $wooCommerceOrder['total'],
            'amount_paid'            => $wooCommerceOrder['date_paid'] ? $wooCommerceOrder['total'] : 0,
            'payment_method'         => $wooCommerceOrder['payment_method'],
            'payment_method_title'   => $wooCommerceOrder['payment_method_title'],
            'transaction_id'         => $wooCommerceOrder['transaction_id'] ?? null,
            'billing'                => $wooCommerceOrder['billing'],
            'shipping'               => $wooCommerceOrder['shipping'],
            'date_paid'              => $wooCommerceOrder['date_paid'],
            'woocommerce_created_at' => $wooCommerceOrder['date_created'],
            'dg_order_code'          => 'DG-' . str_pad(Order::max('id') + 1, 5, '0', STR_PAD_LEFT),
            'production_category'    => 'cad_casting',
        ]);
 
        $this->saveOrUpdateLineItems($newOrder, $wooCommerceOrder['line_items']);
 
        $newOrder->update(['product_name' => $newOrder->lineItems()->first()?->product_name]);
 
        // Default to cad_casting — can be changed per order in the UI
        $newOrder->createDefaultTasks('cad_casting');
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

    private function buildStoneData($lineItem): ?array
    {
        if (!$lineItem) return null;

        $metal     = $lineItem->getMetaValue('Metal') ?? $lineItem->getMetaValue('Material');
        $carat     = $lineItem->getMetaValue('Carat');
        $clarity   = $lineItem->getMetaValue('Clarity');
        $colour    = $lineItem->getMetaValue('Colour');
        $ringSize  = $lineItem->getMetaValue('Ring Size');
        $bandWidth = $lineItem->getMetaValue('Band Width');
        $stoneType = $lineItem->getMetaValue('Stone Type');
        $cert      = $lineItem->getMetaValue('Certificate Number');

        if (!$metal && !$carat && !$ringSize) return null;

        return array_filter([
            'material'  => $metal,
            'size'      => $ringSize,
            'bandWidth' => $bandWidth,
            'stoneType' => $stoneType,
            'carat'     => $carat,
            'clarity'   => $clarity,
            'colour'    => $colour,
            'cert'      => $cert,
        ]);
    }
}