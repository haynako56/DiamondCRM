<?php

namespace App\Http\Controllers;

use App\Models\WooCommerceSetting;
use App\Services\WooCommerceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(): Response
    {
        $settings = WooCommerceSetting::first();

        return Inertia::render('jobs/settings', [
            'settings' => $settings ? [
                'store_url'          => $settings->store_url ?? '',
                'consumer'           => $settings->consumer ?? '',
                'secret'             => $settings->secret ? '••••••••' : '',  // mask secret
                'production_email'   => $settings->production_email ?? '',
                'admin_email'        => $settings->admin_email ?? '',
                'default_turnaround' => $settings->default_turnaround ?? '4 weeks',
            ] : null,
        ]);
    }

    public function saveWooCommerce(Request $request): RedirectResponse
    {
        $request->validate([
            'store_url' => 'required|url|max:255',
            'consumer'  => 'required|string|max:255',
            'secret'    => 'required|string|max:255',
        ]);

        WooCommerceSetting::updateOrCreate(
            ['id' => 1],
            [
                'store_url' => rtrim($request->store_url, '/'),
                'consumer'  => $request->consumer,
                'secret'    => $request->secret,
            ]
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Settings Updated.')]);

        return back();
    }

    public function saveTeam(Request $request): RedirectResponse
    {
        $request->validate([
            'production_email'   => 'nullable|email|max:255',
            'admin_email'        => 'nullable|email|max:255',
            'default_turnaround' => 'required|in:4 weeks,6 weeks,8 weeks',
        ]);

        WooCommerceSetting::updateOrCreate(
            ['id' => 1],
            [
                'production_email'   => $request->production_email,
                'admin_email'        => $request->admin_email,
                'default_turnaround' => $request->default_turnaround,
            ]
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Team Settings Updated.')]);

        return back();
    }

    public function testConnection(): RedirectResponse
    {
        try {
            $service = new WooCommerceService();
            $orders  = $service->getAllOrders(['per_page' => 1]);

            return back()->with('connection_status', 'success');
        } catch (\Exception $exception) {
            return back()->with('connection_status', 'failed')->with('connection_error', $exception->getMessage());
        }
    }
}