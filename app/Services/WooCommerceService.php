<?php

namespace App\Services;

use App\Models\WooCommerceSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\Response;

class WooCommerceService
{
    private string $baseUrl;
    private string $consumerKey;
    private string $consumerSecret;

    public function __construct()
    {
        $settings = WooCommerceSetting::firstOrFail();

        $this->baseUrl        = $settings->store_url;
        $this->consumerKey    = $settings->consumer;
        $this->consumerSecret = $settings->secret;
    }

    private function apiClient(): \Illuminate\Http\Client\PendingRequest
    {
        return Http::withBasicAuth($this->consumerKey, $this->consumerSecret)
                   ->baseUrl($this->baseUrl . '/wp-json/wc/v3/');
    }

    public function getAllOrders(array $filters = []): array
    {
        $queryParams = array_merge(['per_page' => 100], $filters);

        $response = $this->apiClient()->get('orders', $queryParams);

        if ($response->failed()) {
            throw new \RuntimeException(
                "WooCommerce API error while fetching orders: " .
                "[HTTP {$response->status()}] " .
                $response->body()
            );
        }

        return $response->json();
    }
}