<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WooCommerceSetting extends Model
{
    protected $table = 'woocommerce_settings';

    protected $fillable = [
        'store_url',
        'consumer',
        'secret',
        'production_email',
        'admin_email',
        'default_turnaround',
    ];
}