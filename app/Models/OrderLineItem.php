<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderLineItem extends Model
{
    protected $fillable = [
        'order_id',
        'woocommerce_line_item_id',
        'product_name',
        'product_id',
        'quantity',
        'total',
        'image_url',
        'meta_data',
        'category',
    ];

    protected $casts = [
        'meta_data' => 'array',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    // -------------------------------------------------------------------------
    // Auto-detect category before saving
    // -------------------------------------------------------------------------

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (OrderLineItem $lineItem) {
            $lineItem->category = $lineItem->detectCategory();
        });
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function getMetaValue(string $displayKey): ?string
    {
        $metaItem = collect($this->meta_data)
            ->firstWhere('display_key', $displayKey);

        return $metaItem['display_value'] ?? null;
    }

    private function detectCategory(): string
    {
        $hasRingSize      = collect($this->meta_data)->contains('display_key', 'Ring Size');
        $nameContainsRing = str_contains(strtolower($this->product_name), 'ring');

        if ($hasRingSize || $nameContainsRing) {
            return 'ring';
        }

        return 'jewellery';
    }
}