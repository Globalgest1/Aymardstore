<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Services\NotificationService;
use App\Models\Product;
use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class NotificationWorkflowTest extends TestCase
{
    public function test_safe_external_url_validation(): void
    {
        // Must reject local, loopback, private ranges, invalid schemes
        $this->assertFalse(NotificationService::isSafeExternalUrl(''));
        $this->assertFalse(NotificationService::isSafeExternalUrl(null));
        $this->assertFalse(NotificationService::isSafeExternalUrl('javascript:alert(1)'));
        $this->assertFalse(NotificationService::isSafeExternalUrl('file:///etc/passwd'));
        $this->assertFalse(NotificationService::isSafeExternalUrl('http://localhost:8000/webhook'));
        $this->assertFalse(NotificationService::isSafeExternalUrl('http://127.0.0.1:3000/callback'));
        $this->assertFalse(NotificationService::isSafeExternalUrl('http://10.0.0.1/admin'));
        $this->assertFalse(NotificationService::isSafeExternalUrl('http://192.168.1.1/internal'));
        $this->assertFalse(NotificationService::isSafeExternalUrl('http://169.254.169.254/latest/meta-data'));

        // Must accept valid public HTTPS URL
        $this->assertTrue(NotificationService::isSafeExternalUrl('https://api.telegram.org/bot123/sendMessage'));
        $this->assertTrue(NotificationService::isSafeExternalUrl('https://hooks.slack.com/services/T00/B00/X00'));
    }

    public function test_get_sender_returns_valid_anti_spam_email(): void
    {
        $sender = NotificationService::getSender('orders');
        $this->assertNotEmpty($sender);
        $this->assertStringContainsString('Aymard Store', $sender);
        $this->assertMatchesRegularExpression('/<[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}>/', $sender);
    }

    public function test_order_notification_service_dispatches_clean_html_telegram_and_emails(): void
    {
        Http::fake([
            'https://api.telegram.org/*' => Http::response(['ok' => true], 200),
            'https://api.resend.com/emails' => Http::response(['id' => 'resend_test_123'], 200),
        ]);

        $orderData = [
            'id' => 'ord_notif_test_' . uniqid(),
            'customer_name' => 'Jean-Luc Godard',
            'customer_email' => 'client@luxurytest.com',
            'customer_phone' => '+229 97 00 00 00',
            'total' => 150.00,
            'currency' => 'EUR',
            'payment_status' => 'pending',
            'payment_method' => 'card',
            'shipping_address' => [
                'fullName' => 'Jean-Luc Godard',
                'street' => 'Avenue Steinmetz',
                'city' => 'Cotonou',
                'country' => 'Bénin',
            ],
            'items' => [
                [
                    'name' => 'Nike Air Force 1 "Luxury Edition"',
                    'quantity' => 1,
                    'price' => 150.00,
                    'selected_size' => '43',
                    'selected_color' => 'Blanc / Noir',
                ]
            ]
        ];

        $settings = [
            'telegramBotToken' => 'fake_token_12345',
            'telegramChatId' => 'fake_chat_999',
            'resendApiKey' => 're_fake_key_test',
            'adminEmail' => 'merchant@aymardstore.com',
            'telegramEnabled' => true,
            'emailEnabled' => true,
        ];

        $results = NotificationService::sendOrderNotifications($orderData, $settings);

        $this->assertTrue($results['telegram'], 'Telegram dispatch must succeed');
        $this->assertTrue($results['merchant_email'], 'Merchant email dispatch must succeed');
        $this->assertTrue($results['customer_email'], 'Customer confirmation email dispatch must succeed');

        // Check Telegram payload: must use parse_mode = HTML and contain customer name
        Http::assertSent(function ($request) {
            if (str_contains($request->url(), 'telegram.org')) {
                $body = $request->data();
                return ($body['parse_mode'] ?? '') === 'HTML'
                    && str_contains($body['text'], 'AYMARD STORE')
                    && str_contains($body['text'], 'Jean-Luc Godard');
            }
            return true;
        });

        // Check Resend payload for customer: subject must not contain spam triggers
        Http::assertSent(function ($request) {
            if (str_contains($request->url(), 'resend.com/emails')) {
                $body = $request->data();
                if (in_array('client@luxurytest.com', $body['to'] ?? [])) {
                    return str_contains($body['subject'], 'Confirmation de votre commande')
                        && !str_contains($body['subject'], '🔥')
                        && !str_contains($body['subject'], 'URGENT')
                        && str_contains($body['html'], 'AYMARD STORE');
                }
            }
            return true;
        });
    }

    public function test_send_otp_api_uses_professional_template_and_anti_spam_subject(): void
    {
        Http::fake([
            'https://api.resend.com/emails' => Http::response(['id' => 'otp_email_test_id'], 200),
        ]);

        $testEmail = 'otp_test_' . uniqid() . '@example.com';

        $response = $this->postJson('/api/auth/send-otp', [
            'email' => $testEmail,
        ]);

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));

        // Verify OTP is stored in cache
        $cachedOtp = Cache::get('otp_' . $testEmail);
        $this->assertNotEmpty($cachedOtp);
        $this->assertEquals(6, strlen($cachedOtp));

        // Verify email subject doesn't have spam emoji triggers
        Http::assertSent(function ($request) use ($testEmail, $cachedOtp) {
            if (str_contains($request->url(), 'resend.com/emails')) {
                $body = $request->data();
                return in_array($testEmail, $body['to'] ?? [])
                    && str_contains($body['subject'], "Code de vérification : {$cachedOtp}")
                    && !str_contains($body['subject'], '🔑')
                    && str_contains($body['html'], 'AYMARD STORE');
            }
            return true;
        });
    }

    public function test_broadcast_api_validates_payload_and_uses_anti_spam_subject(): void
    {
        Http::fake([
            'https://api.resend.com/emails' => Http::response(['id' => 'broadcast_email_test'], 200),
        ]);

        // 1. Unauthenticated request must be rejected with 401
        $unauthResponse = $this->postJson('/api/broadcast', []);
        $unauthResponse->assertStatus(401);

        // 2. Authenticated as Admin
        $admin = \App\Models\User::firstOrCreate(
            ['email' => 'admin_broadcast_test@aymardstore.com'],
            ['name' => 'Admin Broadcast', 'password' => bcrypt('AdminPass123!'), 'role' => 'ADMIN']
        );
        $admin->role = 'ADMIN';
        $admin->save();

        $responseMissingProduct = $this->actingAs($admin)->postJson('/api/broadcast', []);
        $responseMissingProduct->assertStatus(400);

        $response = $this->actingAs($admin)->postJson('/api/broadcast', [
            'product' => [
                'id' => 'prod_broadcast_test',
                'name_fr' => 'Yeezy Boost 350 Onyx',
                'price' => 250.00,
                'stock' => 5,
            ],
            'channels' => ['EMAIL'],
            'subscribers' => [
                [
                    'email' => 'subscriber@aymardstore.com',
                    'active' => true,
                    'channels' => ['EMAIL'],
                ]
            ],
            'merchantSettings' => [
                'resendApiKey' => 're_fake_broadcast_test',
            ]
        ]);

        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));

        Http::assertSent(function ($request) {
            if (str_contains($request->url(), 'resend.com/emails')) {
                $body = $request->data();
                return str_contains($body['subject'], 'Nouveauté exclusive : Yeezy Boost 350 Onyx — Aymard Store')
                    && !str_contains($body['subject'], '🔥')
                    && !str_contains($body['subject'], 'NOUVEAU DROP');
            }
            return true;
        });
    }
}
