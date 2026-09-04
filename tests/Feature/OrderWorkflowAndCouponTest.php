<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Product;
use App\Models\Order;
use App\Models\Coupon;
use Illuminate\Support\Facades\Hash;

class OrderWorkflowAndCouponTest extends TestCase
{
    public function test_order_creation_with_percentage_coupon(): void
    {
        $product = Product::updateOrCreate(
            ['id' => 'prod_test_coupon_pct'],
            [
                'slug' => 'test-coupon-percent-prod',
                'name_fr' => 'Sneaker Coupon Test',
                'price' => 200.00,
                'stock' => 15,
                'category' => 'shoes',
            ]
        );

        Coupon::updateOrCreate(
            ['code' => 'PROMO10'],
            [
                'type' => 'percent',
                'value' => 10.00, // 10% discount
                'is_active' => true,
            ]
        );

        $response = $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->postJson('/checkout', [
                'customerEmail' => 'coupon_buyer@aymardstore.com',
                'customerName' => 'Coupon Buyer',
                'currency' => 'EUR',
                'promoCodeUsed' => 'PROMO10',
                'shippingAddress' => [
                    'fullName' => 'Coupon Buyer',
                    'street' => 'Haie Vive',
                    'city' => 'Cotonou',
                    'country' => 'Bénin',
                ],
                'items' => [
                    [
                        'product' => ['id' => $product->id],
                        'quantity' => 1,
                    ]
                ],
            ]);

        $response->assertStatus(200);
        $order = Order::findOrFail($response->json('order.id'));

        // 200€ - 10% (20€) = 180€
        $this->assertEquals(180.00, (float)$order->total);
        $this->assertEquals(20.00, (float)$order->discount_applied);
        $this->assertEquals('PROMO10', $order->promo_code_used);

        $order->delete();
    }

    public function test_order_creation_with_fixed_coupon(): void
    {
        $product = Product::updateOrCreate(
            ['id' => 'prod_test_coupon_fixed'],
            [
                'slug' => 'test-coupon-fixed-prod',
                'name_fr' => 'Sneaker Fixed Test',
                'price' => 100.00,
                'stock' => 20,
                'category' => 'shoes',
            ]
        );

        Coupon::updateOrCreate(
            ['code' => 'REDUC15'],
            [
                'type' => 'fixed',
                'value' => 15.00, // 15€ discount
                'is_active' => true,
            ]
        );

        $response = $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->postJson('/checkout', [
                'customerEmail' => 'fixed_buyer@aymardstore.com',
                'currency' => 'EUR',
                'promoCodeUsed' => 'REDUC15',
                'shippingAddress' => [
                    'fullName' => 'Fixed Buyer',
                    'street' => 'Rue du Commerce',
                    'city' => 'Cotonou',
                    'country' => 'Bénin',
                ],
                'items' => [
                    [
                        'product' => ['id' => $product->id],
                        'quantity' => 1,
                    ]
                ],
            ]);

        $response->assertStatus(200);
        $order = Order::findOrFail($response->json('order.id'));

        // 100€ - 15€ = 85€
        $this->assertEquals(85.00, (float)$order->total);
        $this->assertEquals(15.00, (float)$order->discount_applied);

        $order->delete();
    }

    public function test_order_creation_fails_when_stock_insufficient(): void
    {
        $product = Product::updateOrCreate(
            ['id' => 'prod_test_stock_low'],
            [
                'slug' => 'test-low-stock-prod',
                'name_fr' => 'Low Stock Sneaker',
                'price' => 80.00,
                'stock' => 2, // only 2 left
                'category' => 'shoes',
            ]
        );

        $response = $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->postJson('/checkout', [
                'customerEmail' => 'greedy_buyer@aymardstore.com',
                'shippingAddress' => ['fullName' => 'Greedy Buyer'],
                'items' => [
                    [
                        'product' => ['id' => $product->id],
                        'quantity' => 10, // requested 10
                    ]
                ],
            ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('Stock insuffisant', $response->json('error'));
    }

    public function test_order_creation_decrements_product_stock_atomically(): void
    {
        $product = Product::updateOrCreate(
            ['id' => 'prod_test_stock_decrement'],
            [
                'slug' => 'test-decrement-stock-prod',
                'name_fr' => 'Stock Decrement Sneaker',
                'price' => 110.00,
                'stock' => 10,
                'category' => 'shoes',
            ]
        );

        $response = $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->postJson('/checkout', [
                'customerEmail' => 'stock_buyer@aymardstore.com',
                'shippingAddress' => ['fullName' => 'Stock Buyer'],
                'items' => [
                    [
                        'product' => ['id' => $product->id],
                        'quantity' => 3,
                    ]
                ],
            ]);

        $response->assertStatus(200);
        $this->assertEquals(7, $product->fresh()->stock);

        Order::find($response->json('order.id'))?->delete();
    }

    public function test_admin_can_update_order_status_via_api(): void
    {
        $admin = User::where('email', 'judesinaberogui@gmail.com')->first();
        if (!$admin) {
            $admin = User::create([
                'name' => 'Judesinaberogui',
                'email' => 'judesinaberogui@gmail.com',
                'password' => Hash::make('Mercredi12@'),
                'role' => 'ADMIN',
            ]);
        }

        $order = Order::create([
            'id' => 'ord_test_status_upd',
            'order_number' => 'AYM-TEST-STATUS',
            'customer_email' => 'status_customer@test.com',
            'total' => 200.00,
            'status' => 'PENDING',
            'payment_status' => 'UNPAID',
            'shipping_address' => ['fullName' => 'Status Customer'],
            'items' => [],
        ]);

        $response = $this->actingAs($admin)->patchJson('/api/orders/' . $order->id, [
            'status' => 'SHIPPED',
            'tracking_number' => 'TRK-BJ-999888',
            'tracking_step' => 3,
        ]);

        $response->assertStatus(200);
        $order->refresh();
        $this->assertEquals('SHIPPED', $order->status);
        $this->assertEquals('TRK-BJ-999888', $order->tracking_number);
        $this->assertEquals(3, (int)$order->tracking_step);

        $order->delete();
    }
}
