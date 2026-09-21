<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderFinanceCost extends Model
{
    protected $fillable = [
        'order_finance_id',
        'sort_order',
        'key',
        'label',
        'supplier',
        'amount',
        'note',
        'is_saved',
        'is_custom',
    ];

    protected $casts = [
        'amount'    => 'float',
        'is_saved'  => 'boolean',
        'is_custom' => 'boolean',
    ];

    public function finance(): BelongsTo
    {
        return $this->belongsTo(OrderFinance::class, 'order_finance_id');
    }
}
