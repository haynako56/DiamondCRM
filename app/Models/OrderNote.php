<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderNote extends Model
{
    protected $fillable = ['order_id', 'content'];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
