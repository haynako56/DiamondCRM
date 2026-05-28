<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\OrderLineItem;
use App\Services\WooCommerceService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncWooCommerceOrdersCommand extends Command
{
    protected $signature   = 'woocommerce:sync-orders';
    protected $description = 'Fetch all orders from WooCommerce and save them to the database.';

    public function handle(WooCommerceService $wooCommerceService): void
    {
        $this->info('Syncing WooCommerce orders...');

        $wooCommerceOrders = $wooCommerceService->getAllOrders();

        $synced = 0;
        $created = 0;

        foreach ($wooCommerceOrders as $wooCommerceOrder) {
            // Skip completed orders
            if ($wooCommerceOrder['status'] === 'completed' || $wooCommerceOrder['status'] === 'checkout-draft' || $wooCommerceOrder['status'] === 'cancelled' || $wooCommerceOrder['status'] === 'failed' || $wooCommerceOrder['status'] === 'pending') {
                continue;
            }

            $this->saveOrUpdateOrder($wooCommerceOrder, $created);
            $synced++;
        }

        Log::info('WooCommerce orders synced via cron.', [
            'total_synced'  => $synced,
            'total_created' => $created,
        ]);

        $this->info("Done. {$synced} orders synced, {$created} new orders created.");
    }

    private function saveOrUpdateOrder(array $wooCommerceOrder, int &$created): void
    {
        $existingOrder = Order::where('woocommerce_order_id', $wooCommerceOrder['id'])->first();

        if ($existingOrder) {
            // Order already exists — update data only, never touch tasks
            $existingOrder->update([
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
            'order_due_date'         => \Carbon\Carbon::parse($wooCommerceOrder['date_created'])->addWeeks(4),
            'dg_order_code'          => 'DG-' . str_pad(Order::max('id') + 1, 5, '0', STR_PAD_LEFT),
            'production_category'    => 'cad_casting',
        ]);

        $this->saveOrUpdateLineItems($newOrder, $wooCommerceOrder['line_items']);

        $newOrder->update(['product_name' => $newOrder->lineItems()->first()?->product_name]);

        $newOrder->createDefaultTasks('cad_casting');

        $created++;
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
}