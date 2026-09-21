<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrderFinance extends Model
{
    // Every finance record starts with these four cost lines
    public const DEFAULT_COSTS = [
        ['key' => 'diamond',    'label' => 'Diamond purchase'],
        ['key' => 'cad',        'label' => 'CAD design'],
        ['key' => 'casting',    'label' => 'Casting'],
        ['key' => 'production', 'label' => 'Production'],
    ];

    protected $fillable = [
        'order_id',
        'costings_done',
    ];

    protected $casts = [
        'costings_done' => 'boolean',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function costs(): HasMany
    {
        return $this->hasMany(OrderFinanceCost::class)->orderBy('sort_order');
    }

    public function createDefaultCosts(): void
    {
        foreach (self::DEFAULT_COSTS as $sortOrder => $costDefinition) {
            $this->costs()->create([
                'sort_order' => $sortOrder + 1,
                'key'        => $costDefinition['key'],
                'label'      => $costDefinition['label'],
            ]);
        }
    }

    public function totalCost(): float
    {
        return (float) $this->costs->sum('amount');
    }
}
