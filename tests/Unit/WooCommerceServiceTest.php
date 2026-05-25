<?php

namespace Tests\Unit;

use App\Models\WooCommerceSetting;
use App\Services\WooCommerceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class WooCommerceServiceTest extends TestCase
{
    use RefreshDatabase;

    private WooCommerceService $wooCommerceService;

    protected function setUp(): void
    {
        parent::setUp();

        // Insert a real settings row — no mocking needed
        WooCommerceSetting::create([
            'consumer' => 'ck_test_consumer_key',
            'secret'   => 'cs_test_consumer_secret',
        ]);

        config(['woocommerce.store_url' => 'https://fake-store.example.com']);

        $this->wooCommerceService = new WooCommerceService();
    }

    #[Test]
    public function it_fetches_all_orders_and_returns_them_as_an_array(): void
    {
        Http::fake([
            '*/wp-json/wc/v3/orders*' => Http::response([
                ['id' => 1, 'status' => 'processing', 'total' => '99.00'],
                ['id' => 2, 'status' => 'completed',  'total' => '49.50'],
            ], 200),
        ]);

        $orders = $this->wooCommerceService->getAllOrders();

        $this->assertIsArray($orders);
        $this->assertCount(2, $orders);
        $this->assertEquals(1, $orders[0]['id']);
        $this->assertEquals('completed', $orders[1]['status']);
    }

    #[Test]
    public function it_sends_basic_auth_credentials_with_every_request(): void
    {
        Http::fake([
            '*/wp-json/wc/v3/orders*' => Http::response([], 200),
        ]);

        $this->wooCommerceService->getAllOrders();

        Http::assertSent(function (Request $request) {
            $expectedToken = base64_encode('ck_test_consumer_key:cs_test_consumer_secret');
            return $request->hasHeader('Authorization', "Basic {$expectedToken}");
        });
    }

    #[Test]
    public function it_passes_filters_as_query_parameters(): void
    {
        Http::fake([
            '*/wp-json/wc/v3/orders*' => Http::response([], 200),
        ]);

        $this->wooCommerceService->getAllOrders(['status' => 'processing', 'per_page' => 10]);

        Http::assertSent(function (Request $request) {
            return str_contains($request->url(), 'status=processing')
                && str_contains($request->url(), 'per_page=10');
        });
    }

    #[Test]
    public function it_throws_an_exception_when_the_api_returns_an_error(): void
    {
        Http::fake([
            '*/wp-json/wc/v3/orders*' => Http::response(['message' => 'Unauthorized'], 401),
        ]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/fetching orders/');

        $this->wooCommerceService->getAllOrders();
    }
}