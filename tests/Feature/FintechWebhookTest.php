<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Order;

class FintechWebhookTest extends TestCase
{
    public function test_leekpay_webhook_updates_order_to_paid_with_valid_signature(): void
    {
        $secret = 'test_leekpay_secret_key_123';
        \Illuminate\Support\Env::getRepository()->set('LEEKPAY_SECRET_KEY', $secret);
        $_ENV['LEEKPAY_SECRET_KEY'] = $secret;
        putenv("LEEKPAY_SECRET_KEY={$secret}");

        $order = Order::create([
            'id' => 'ord_test_leekpay_' . uniqid(),
            'order_number' => 'AYM-LP-' . uniqid(),
            'customer_email' => 'leekpay_user@test.com',
            'total' => 250.00,
            'status' => 'PENDING',
            'payment_status' => 'UNPAID',
            'shipping_address' => ['fullName' => 'Leekpay User'],
            'items' => [],
        ]);

        $payload = json_encode([
            'orderId' => $order->id,
            'status' => 'SUCCESS',
            'transactionId' => 'tx_leekpay_123456',
            'amount' => 250.00,
        ]);

        $signature = hash_hmac('sha256', $payload, $secret);

        $response = $this->call('POST', '/api/webhook/leekpay', [], [], [], [
            'HTTP_CONTENT_TYPE' => 'application/json',
            'HTTP_X_LEEKPAY_SIGNATURE' => $signature,
        ], $payload);

        $response->assertStatus(200);
        $order->refresh();
        $this->assertEquals('PAID', $order->payment_status);
        $this->assertEquals('tx_leekpay_123456', $order->payment_transaction_id);

        $order->delete();
    }

    public function test_leekpay_webhook_rejects_invalid_signature(): void
    {
        $secret = 'test_leekpay_secret_key_123';
        putenv("LEEKPAY_SECRET_KEY={$secret}");
        $_ENV['LEEKPAY_SECRET_KEY'] = $secret;

        $payload = json_encode(['orderId' => 'ord_fake', 'status' => 'SUCCESS']);

        $response = $this->call('POST', '/api/webhook/leekpay', [], [], [], [
            'HTTP_CONTENT_TYPE' => 'application/json',
            'HTTP_X_LEEKPAY_SIGNATURE' => 'invalid_fake_signature_xyz',
        ], $payload);

        $response->assertStatus(403);
    }

    public function test_saspay_webhook_updates_order_to_paid_with_valid_hmac(): void
    {
        $signingSecret = 'whsec_test_saspay_secret_456';
        \Illuminate\Support\Env::getRepository()->set('SASPAY_SIGNING_SECRET', $signingSecret);
        $_ENV['SASPAY_SIGNING_SECRET'] = $signingSecret;
        putenv("SASPAY_SIGNING_SECRET={$signingSecret}");

        $order = Order::create([
            'id' => 'ord_test_saspay_' . uniqid(),
            'order_number' => 'AYM-SP-' . uniqid(),
            'customer_email' => 'saspay_user@test.com',
            'total' => 180.00,
            'status' => 'PENDING',
            'payment_status' => 'UNPAID',
            'shipping_address' => ['fullName' => 'Saspay User'],
            'items' => [],
        ]);

        $timestamp = (string)time();
        $payload = json_encode([
            'event' => 'transaction.success',
            'data' => [
                'id' => 'tx_saspay_789012',
                'order_id' => $order->id,
                'amount' => 180.00,
            ]
        ]);

        $signature = hash_hmac('sha256', "{$timestamp}.{$payload}", $signingSecret);

        $response = $this->call('POST', '/api/webhook/saspay', [], [], [], [
            'HTTP_CONTENT_TYPE' => 'application/json',
            'HTTP_X_WEBHOOK_SIGNATURE' => $signature,
            'HTTP_X_WEBHOOK_TIMESTAMP' => $timestamp,
            'HTTP_X_WEBHOOK_EVENT' => 'transaction.success',
        ], $payload);

        $response->assertStatus(200);
        $order->refresh();
        $this->assertEquals('PAID', $order->payment_status);
        $this->assertEquals('tx_saspay_789012', $order->payment_transaction_id);

        $order->delete();
    }

    public function test_saspay_webhook_rejects_missing_signature(): void
    {
        $signingSecret = 'whsec_test_saspay_secret_456';
        \Illuminate\Support\Env::getRepository()->set('SASPAY_SIGNING_SECRET', $signingSecret);
        $_ENV['SASPAY_SIGNING_SECRET'] = $signingSecret;
        putenv("SASPAY_SIGNING_SECRET={$signingSecret}");

        $payload = json_encode(['event' => 'transaction.success']);

        $response = $this->call('POST', '/api/webhook/saspay', [], [], [], [
            'HTTP_CONTENT_TYPE' => 'application/json',
        ], $payload);

        $response->assertStatus(401);
    }

    public function test_fintech_verify_returns_unverified_when_gateway_not_active(): void
    {
        $response = $this->postJson('/api/payments/verify', [
            'transactionId' => 'tx_unverified_123',
        ]);

        $response->assertStatus(422);
        $this->assertEquals('UNVERIFIED', $response->json('status'));
        $this->assertFalse($response->json('success'));
    }
}
