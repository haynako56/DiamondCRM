<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\WooCommerceSettingsRequest;
use App\Models\WooCommerceSetting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class WooCommerceController extends Controller
{
    public function edit(): Response
    {
        $settings = WooCommerceSetting::first();

        return Inertia::render('settings/woocommerce', [
            'settings' => $settings,
        ]);
    }

    public function update(WooCommerceSettingsRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $settings = WooCommerceSetting::first();

        if (! $settings) {
            $settings = WooCommerceSetting::create($data);
        } else {
            $settings->update($data);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('WooCommerce settings saved.')]);

        return to_route('settings.woocommerce.edit');
    }
}
