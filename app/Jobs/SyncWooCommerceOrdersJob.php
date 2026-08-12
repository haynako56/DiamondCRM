<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\OrderLineItem;
use App\Services\WooCommerceService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SyncWooCommerceOrdersJob implements ShouldQueue
{
    use Queueable;

    public function handle(WooCommerceService $wooCommerceService): void
    {
        $wooCommerceOrders = $wooCommerceService->getAllOrders();

        foreach ($wooCommerceOrders as $wooCommerceOrder) {
            $this->saveOrUpdateOrder($wooCommerceOrder);
        }

        Log::info('WooCommerce orders synced successfully.', [
            'total_orders' => count($wooCommerceOrders),
        ]);
    }

    private function saveOrUpdateOrder(array $wooCommerceOrder): void
    {
        $existingOrder = Order::where('woocommerce_order_id', $wooCommerceOrder['id'])->first();

        if ($existingOrder) {
            // Order already exists — just update the data, don't touch tasks
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
                'customer_note'          => $wooCommerceOrder['customer_note'] ?? null,
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
            'customer_note'          => $wooCommerceOrder['customer_note'] ?? null,
            'date_paid'              => $wooCommerceOrder['date_paid'],
            'woocommerce_created_at' => $wooCommerceOrder['date_created'],
        ]);

        $this->saveOrUpdateLineItems($newOrder, $wooCommerceOrder['line_items']);

        // Default to cad_casting — can be changed per order in the UI later
        $newOrder->createDefaultTasks('cad_casting');
        // $newOrder->createDefaultTasks('handmade');
        // $newOrder->createDefaultTasks('supplier_product');

        Log::info("Created new order with default tasks.", [
            'woocommerce_order_id' => $newOrder->woocommerce_order_id,
        ]);
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