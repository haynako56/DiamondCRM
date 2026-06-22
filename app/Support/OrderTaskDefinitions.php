<?php

namespace App\Support;

class OrderTaskDefinitions
{
    // Maps the human-readable category label to a production method key
    public static function methodFromCategory(string $category): string
    {
        return match(true) {
            str_contains($category, 'CAD')              => 'cad_casting',
            str_contains($category, 'Handmade')         => 'handmade',
            str_contains($category, 'Supplier')         => 'supplier_product',
            str_contains($category, 'Ring Resize')      => 'ring_resize',
            str_contains($category, 'Jewellery Repair') => 'jewellery_repair',
            str_contains($category, 'Jewellery')        => 'supplier_product',
            default                                     => 'cad_casting',
        };
    }

    public static function forMethod(string $method): array
    {
        return match($method) {
            'cad_casting'      => static::cadCastingTasks(),
            'handmade'         => static::handmadeTasks(),
            'supplier_product' => static::supplierProductTasks(),
            'ring_resize'      => static::ringResizeTasks(),
            'jewellery_repair' => static::jewelleryRepairTasks(),
            'custom'           => [],  // no default tasks — user adds their own
            default            => static::cadCastingTasks(),
        };
    }

    private static function cadCastingTasks(): array
    {
        return [
            ['key' => 'diamonds_order',     'label' => 'Diamonds — order placed',  'description' => 'Place the diamond order with supplier.'],
            ['key' => 'diamonds_delivered', 'label' => 'Diamonds — delivered',      'description' => 'Confirm diamonds have been received in store.'],
            ['key' => 'cad_send',           'label' => 'Send CAD request',          'description' => 'Request CAD design file from designer.'],
            ['key' => 'cad_approve',        'label' => 'Client approves CAD',       'description' => 'Send design to client, await sign-off.'],
            ['key' => 'casting',            'label' => 'Send to casting',           'description' => 'Send approved design to casting.'],
            ['key' => 'production',         'label' => 'Production — Daniele',      'description' => 'In-house production and setting.'],
            ['key' => 'dispatch',           'label' => 'Dispatch to client',        'description' => 'Send with tracking or arrange pickup.'],
        ];
    }

    private static function handmadeTasks(): array
    {
        return [
            ['key' => 'production', 'label' => 'Production — Daniele', 'description' => 'In-house production and setting.'],
            ['key' => 'dispatch',   'label' => 'Dispatch to client',   'description' => 'Send with tracking or arrange pickup.'],
        ];
    }

    private static function supplierProductTasks(): array
    {
        return [
            ['key' => 'supplier_order',     'label' => 'Order from supplier',  'description' => 'Place order and confirm ETA.'],
            ['key' => 'delivery_confirmed', 'label' => 'Delivery confirmed',   'description' => 'Mark when item arrives in store.'],
            ['key' => 'dispatch',           'label' => 'Dispatch to client',   'description' => 'Send with tracking or arrange pickup.'],
        ];
    }

    private static function ringResizeTasks(): array
    {
        return [
            ['key' => 'production',       'label' => 'Production — Daniele', 'description' => 'Resize and finish the ring.'],
            ['key' => 'return_to_client', 'label' => 'Return to client',     'description' => 'Return the completed ring to the client.'],
        ];
    }

    private static function jewelleryRepairTasks(): array
    {
        return [
            ['key' => 'production',       'label' => 'Production — Daniele', 'description' => 'Carry out the repair.'],
            ['key' => 'return_to_client', 'label' => 'Return to client',     'description' => 'Return the repaired item to the client.'],
        ];
    }
}