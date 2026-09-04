<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Product;
use App\Models\Order;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;

class SecurityAndIntegrityTest extends TestCase
{
    /**
     * 1. Test that invalid password cannot log in, and NEVER auto-authenticates the user
     */
    public function test_login_strictly_fails_with_wrong_password_and_does_not_authenticate_user(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'victim_customer@aymardstore.com'],
            [
                'name' => 'Victime Test',
                'password' => Hash::make('CorrectPassword123!'),
                'role' => 'CUSTOMER',
            ]
        );

        $response = $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->postJson('/auth/login', [
                'email' => 'victim_customer@aymardstore.com',
                'password' => 'WrongPasswordHacker!',
            ]);

        $response->assertStatus(401);
        $this->assertGuest();
    }

    /**
     * 2. Test that unverified admin session cookies do NOT bypass admin protection
     */
    public function test_admin_access_strictly_forbidden_with_unauthenticated_cookie(): void
    {
        $response = $this->withUnencryptedCookies([
            'aymard_admin_session' => 'admin_fake_token_123',
            'aymard_user_session' => json_encode(['role' => 'ADMIN', 'email' => 'fake@admin.com']),
        ])->get('/admin');

        // Must redirect to login or reject 401, not 200 OK
        $this->assertTrue(in_array($response->getStatusCode(), [302, 401]));
        if ($response->getStatusCode() === 302) {
            $response->assertRedirectContains('/auth/login');
        }
    }

    /**
     * 3. Test that checkout recalculates prices strictly on server-side and locks payment_status
     */
    public function test_checkout_recalculates_prices_server_side_ignoring_client_tampering(): void
    {
        $testProduct = Product::updateOrCreate(
            ['id' => 'prod_test_security_1'],
            [
                'slug' => 'produit-test-audit',
                'name_fr' => 'Sneaker Test Audit',
                'price' => 150.00,
                'stock' => 10,
                'category' => 'shoes',
            ]
        );

        // Attacker attempts to buy a 150€ sneaker for 0.05€ and injects paymentStatus = PAID
        $response = $this->postJson('/checkout', [
            'customerEmail' => 'buyer@test.com',
            'customerName' => 'Buyer Test',
            'total' => 0.05, // Client attempts to force 5 cents
            'paymentStatus' => 'PAID', // Client attempts to mark as PAID
            'currency' => 'EUR',
            'shippingAddress' => [
                'fullName' => 'Buyer Test',
                'street' => 'Rue Test',
                'city' => 'Cotonou',
                'country' => 'Bénin',
            ],
            'items' => [
                [
                    'product' => [
                        'id' => 'prod_test_security_1',
                        'price' => 0.05, // Client attempts unit price tampering
                    ],
                    'quantity' => 1,
                ]
            ],
        ]);

        $response->assertStatus(200);
        $json = $response->json();
        $this->assertTrue($json['success']);

        $createdOrderId = $json['order']['id'];
        $dbOrder = Order::findOrFail($createdOrderId);

        // Server MUST have recalculated 150.00€ and forced UNPAID status
        $this->assertEquals(150.00, (float)$dbOrder->total);
        $this->assertEquals('UNPAID', $dbOrder->payment_status);

        // Clean up test order
        $dbOrder->delete();
    }

    /**
     * 4. Test that anonymous user cannot inspect other customer's orders via ?email= (IDOR)
     */
    public function test_account_page_requires_authentication_and_does_not_leak_orders_via_email_query(): void
    {
        $response = $this->get('/account?email=judesinaberogui@gmail.com');

        // Unauthenticated guest must be redirected to login
        $response->assertStatus(302);
        $response->assertRedirectContains('/auth/login');
    }

    /**
     * 5. Test that mass catalog deletion route DELETE /api/products has been removed
     */
    public function test_delete_all_products_route_is_removed(): void
    {
        $response = $this->deleteJson('/api/products');

        // Must not succeed with 200 OK (should be 404 or 405)
        $this->assertTrue(in_array($response->getStatusCode(), [404, 405]));
    }

    /**
     * 6. Test that brute-force attempts on verify-otp lock out after 5 failures
     */
    public function test_otp_verify_locks_out_after_max_attempts(): void
    {
        $email = 'otp_test_bruteforce@aymardstore.com';
        Cache::put('otp_' . $email, '987654', now()->addMinutes(10));
        Cache::forget('otp_attempts_' . $email);

        for ($i = 1; $i <= 5; $i++) {
            $resp = $this->postJson('/api/auth/verify-otp', [
                'email' => $email,
                'code' => '00000' . $i,
            ]);
            $this->assertFalse($resp->json('success'));
        }

        // 6th attempt should be blocked with 429
        $sixthResp = $this->postJson('/api/auth/verify-otp', [
            'email' => $email,
            'code' => '987654', // even with correct code, now locked out
        ]);

        $this->assertEquals(429, $sixthResp->getStatusCode());

        // Clean up
        Cache::forget('otp_' . $email);
        Cache::forget('otp_attempts_' . $email);
    }

    /**
     * 7. CAMES Audit: Test that brute-force attempts on admin-login lock out with 429
     */
    public function test_admin_login_rate_limiter_blocks_repeated_failed_attempts(): void
    {
        $email = 'fake_hacker_admin@aymardstore.com';

        for ($i = 1; $i <= 5; $i++) {
            $this->postJson('/api/auth/admin-login', [
                'email' => $email,
                'password' => 'wrong_pass_' . $i,
            ]);
        }

        // 6th attempt must be throttled with 429
        $throttled = $this->postJson('/api/auth/admin-login', [
            'email' => $email,
            'password' => 'wrong_pass_6',
        ]);

        $this->assertEquals(429, $throttled->getStatusCode());
    }

    /**
     * 8. CAMES Audit: Test that stock is strictly locked and cannot go negative (overselling prevention)
     */
    public function test_checkout_strictly_prevents_overselling_when_stock_is_depleted(): void
    {
        $scarceProduct = Product::updateOrCreate(
            ['id' => 'prod_test_concurrency_scarce'],
            [
                'slug' => 'produit-stock-limite-audit',
                'name_fr' => 'Sneaker Rare Stock Limité',
                'price' => 200.00,
                'stock' => 1, // Only 1 in stock
                'category' => 'shoes',
            ]
        );

        // Buyer 1 successfully takes the last item
        $resp1 = $this->postJson('/api/orders', [
            'customerEmail' => 'buyer1@aymardstore.com',
            'customerName' => 'Buyer 1',
            'currency' => 'EUR',
            'items' => [
                [
                    'product' => ['id' => 'prod_test_concurrency_scarce'],
                    'quantity' => 1,
                ]
            ],
        ]);

        $this->assertEquals(200, $resp1->getStatusCode());
        $this->assertTrue($resp1->json('success'));

        // Stock must now be 0
        $scarceProduct->refresh();
        $this->assertEquals(0, $scarceProduct->stock);

        // Buyer 2 immediately attempts to buy the same item -> MUST fail with 422
        $resp2 = $this->postJson('/api/orders', [
            'customerEmail' => 'buyer2@aymardstore.com',
            'customerName' => 'Buyer 2',
            'currency' => 'EUR',
            'items' => [
                [
                    'product' => ['id' => 'prod_test_concurrency_scarce'],
                    'quantity' => 1,
                ]
            ],
        ]);

        $this->assertEquals(422, $resp2->getStatusCode());
        $this->assertFalse($resp2->json('success'));

        // Stock must NOT be negative
        $scarceProduct->refresh();
        $this->assertEquals(0, $scarceProduct->stock);

        // Clean up
        $scarceProduct->delete();
    }
}
