<?php

namespace App\Models;

use App\Support\OrderTaskDefinitions;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'woocommerce_order_id',
        'status',
        'currency',
        'total',
        'amount_paid',
        'payment_method',
        'payment_method_title',
        'transaction_id',
        'billing',
        'shipping',
        'date_paid',
        'woocommerce_created_at',
        'address',
        'product_name',
        'production_category',
        'dg_order_code',
        'order_due_date',
        'notes',
        'category',
        'is_manual',
        'payment_note',
        'meta_data',
    ];

    protected $casts = [
        'billing'                => 'array',
        'shipping'               => 'array',
        'date_paid'              => 'datetime',
        'woocommerce_created_at' => 'datetime',
        'order_due_date'         => 'date',
        'total'       => 'float',
        'amount_paid' => 'float',
        'meta_data'   => 'array',
    ];

    protected $appends = ['amount_owing'];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function lineItems(): HasMany
    {
        return $this->hasMany(OrderLineItem::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(OrderTask::class)->orderBy('sort_order');
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    public function getAmountOwingAttribute(): float
    {
        return $this->total - $this->amount_paid;
    }

    public function customerFullName(): string
    {
        return $this->billing['first_name'] . ' ' . $this->billing['last_name'];
    }

    public function customerEmail(): string
    {
        return $this->billing['email'] ?? '';
    }

    public function customerPhone(): string
    {
        return $this->billing['phone'] ?? '';
    }

    public function billingAddress(): string
    {
        // Use the dedicated address field if set, otherwise build from billing JSON
        if ($this->address) {
            return $this->address;
        }

        return implode(', ', array_filter([
            $this->billing['address_1'] ?? '',
            $this->billing['address_2'] ?? '',
            $this->billing['city']      ?? '',
            $this->billing['state']     ?? '',
            $this->billing['postcode']  ?? '',
            $this->billing['country']   ?? '',
        ]));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function createDefaultTasks(string $method): void
    {
        $taskDefinitions = OrderTaskDefinitions::forMethod($method);

        foreach ($taskDefinitions as $sortOrder => $taskDefinition) {
            $this->tasks()->create([
                'method'      => $method,
                'sort_order'  => $sortOrder + 1,
                'key'         => $taskDefinition['key'],
                'label'       => $taskDefinition['label'],
                'description' => $taskDefinition['description'],
            ]);
        }
    }

    // -------------------------------------------------------------------------
    // Static helpers
    // -------------------------------------------------------------------------

    public static function createFromWooCommerce(array $wooCommerceOrder): self
    {
        $order = self::create([
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
            // 'dg_order_code'          => 'DG-' . str_pad($wooCommerceOrder['id'], 5, '0', STR_PAD_LEFT),
            'production_category'    => 'cad_casting',
        ]);

        foreach ($wooCommerceOrder['line_items'] as $lineItem) {
            $order->lineItems()->create([
                'woocommerce_line_item_id' => $lineItem['id'],
                'product_name'             => $lineItem['name'],
                'product_id'               => $lineItem['product_id'],
                'quantity'                 => $lineItem['quantity'],
                'total'                    => $lineItem['total'],
                'image_url'                => $lineItem['image']['src'] ?? null,
                'meta_data'                => $lineItem['meta_data'],
            ]);
        }

        // Set product_name from the first line item
        $order->update([
            'product_name' => $order->lineItems()->first()?->product_name,
        ]);

        return $order;
    }
}