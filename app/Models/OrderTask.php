<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderTask extends Model
{
    protected $fillable = [
        'order_id',
        'method',
        'sort_order',
        'key',
        'label',
        'description',
        'is_done',
        'is_custom',
        'progress',
        'tracking_ref',
        'task_date',
        'received_date',
        'note',
    ];

    protected $casts = [
        'is_done'       => 'boolean',
        'is_custom'     => 'boolean',
        'task_date'     => 'date',
        'received_date' => 'date',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}