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
            ['key' => 'diamonds_order',      'label' => 'Diamonds — order placed', 'description' => 'Place the diamond order with supplier.'],
            ['key' => 'diamonds_delivered',  'label' => 'Diamonds — delivered',     'description' => 'Confirm diamonds have been received in store.'],
            ['key' => 'cad_send',            'label' => 'Send CAD Request',         'description' => 'Request CAD design file from designer.'],
            ['key' => 'cad_received',        'label' => 'CAD Received',             'description' => 'Confirm CAD design file has been received.'],
            ['key' => 'cad_approve',         'label' => 'Client approves CAD',      'description' => 'Send design to client, await sign-off.'],
            ['key' => 'casting',             'label' => 'Send to casting',          'description' => 'Send approved design to casting.'],
            ['key' => 'job_packed',          'label' => 'Job Packed to Daniele',    'description' => 'Pack the job and send to Daniele for production.'],
            ['key' => 'production',          'label' => 'Production at Daniele',    'description' => 'In-house production and setting by Daniele.'],
            ['key' => 'collection_dispatch', 'label' => 'Collection / Dispatch',    'description' => 'Collect from showroom or dispatch to client.'],
        ];
    }

    private static function handmadeTasks(): array
    {
        return [
            ['key' => 'job_packed',          'label' => 'Job Packed to Daniele', 'description' => 'Pack the job and send to Daniele for production.'],
            ['key' => 'production',          'label' => 'Production at Daniele',  'description' => 'In-house production and setting by Daniele.'],
            ['key' => 'awaiting_collection', 'label' => 'Awaiting Collection',    'description' => 'Job is complete and ready for client collection or dispatch.'],
            ['key' => 'collection_dispatch', 'label' => 'Collection / Dispatch',  'description' => 'Collect from showroom or dispatch to client.'],
        ];
    }

    private static function supplierProductTasks(): array
    {
        return [
            ['key' => 'supplier_order',      'label' => 'Order from supplier',  'description' => 'Place order and confirm ETA.'],
            ['key' => 'delivery_confirmed',  'label' => 'Delivery confirmed',   'description' => 'Mark when item arrives in store.'],
            ['key' => 'collection_dispatch', 'label' => 'Collection / Dispatch','description' => 'Collect from showroom or dispatch to client.'],
        ];
    }

    private static function ringResizeTasks(): array
    {
        return [
            ['key' => 'job_packed',          'label' => 'Job Packed to Daniele', 'description' => 'Pack the job and send to Daniele for production.'],
            ['key' => 'production',          'label' => 'Production at Daniele',  'description' => 'Resize and finish the ring.'],
            ['key' => 'awaiting_collection', 'label' => 'Awaiting Collection',    'description' => 'Job is complete and ready for client collection or dispatch.'],
            ['key' => 'collection_dispatch', 'label' => 'Collection / Dispatch',  'description' => 'Collect from showroom or dispatch to client.'],
        ];
    }

    private static function jewelleryRepairTasks(): array
    {
        return [
            ['key' => 'job_packed',          'label' => 'Job Packed to Daniele', 'description' => 'Pack the job and send to Daniele for production.'],
            ['key' => 'production',          'label' => 'Production at Daniele',  'description' => 'Carry out the repair.'],
            ['key' => 'awaiting_collection', 'label' => 'Awaiting Collection',    'description' => 'Job is complete and ready for client collection or dispatch.'],
            ['key' => 'collection_dispatch', 'label' => 'Collection / Dispatch',  'description' => 'Collect from showroom or dispatch to client.'],
        ];
    }
}