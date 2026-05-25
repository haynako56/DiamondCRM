<?php

namespace App\Http\Controllers;

use App\Jobs\SyncWooCommerceOrdersJob;
use Illuminate\Http\JsonResponse;

class SyncWooCommerceOrdersController extends Controller
{
    public function __invoke(): JsonResponse
    {
        SyncWooCommerceOrdersJob::dispatch();

        return response()->json([
            'message' => 'Order sync has been queued successfully.',
        ]);
    }
}