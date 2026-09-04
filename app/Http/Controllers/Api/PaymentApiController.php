<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use Illuminate\Support\Facades\Http;

class PaymentApiController extends Controller
{
    /**
     * LeekPay Checkout Initialization
     */
    public function leekpayCheckout(Request $request)
    {
        try {
            $amount = $request->input('amount', 0);
            $currency = $request->input('currency', 'XOF');
            $description = $request->input('description', 'Commande AYMARD STORE');
            $customerEmail = $request->input('customerEmail') ?: $request->input('customer_email');
            $customerName = $request->input('customerName') ?: $request->input('customer_name');
            $orderId = $request->input('orderId') ?: $request->input('order_id');

            $apiKey = env('LEEKPAY_PUBLIC_KEY');

            if ($apiKey) {
                try {
                    $response = Http::withHeaders([
                        'Content-Type' => 'application/json',
                    ])->post('https://leekpay.fr/api/public/widget/checkout', [
                        'amount' => max(100, (int)round((float)$amount)),
                        'currency' => $currency ?: 'XOF',
                        'key' => $apiKey,
                        'description' => $description ?: 'Commande AYMARD STORE',
                        'customer_email' => $customerEmail ?: null,
                        'customer_name' => $customerName ?: null,
                    ]);

                    if ($response->successful()) {
                        return response()->json($response->json());
                    }
                } catch (\Exception $apiErr) {
                    logger()->warning("[LeekPay Checkout] Direct call failed, falling back to simulated session: " . $apiErr->getMessage());
                }
            }

            if (app()->environment('production')) {
                logger()->emergency('[LeekPay Checkout] Clé LEEKPAY_PUBLIC_KEY absente en production.');
                return response()->json([
                    'success' => false,
                    'message' => 'Passerelle de paiement temporairement indisponible en production.'
                ], 503);
            }

            // Simulated fallback checkout session (local / sandbox only)
            $simTx = 'lp_' . time() . '_' . random_int(1000, 9999);
            return response()->json([
                'success' => true,
                'checkoutUrl' => url("/account?tab=orders&success=true&tx={$simTx}"),
                'transactionId' => $simTx,
                'orderId' => $orderId,
                'amount' => $amount,
                'currency' => $currency,
                'mode' => 'SIMULATION'
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * LeekPay Webhook
     */
    public function leekpayWebhook(Request $request)
    {
        try {
            $rawBody = $request->getContent();
            $payload = json_decode($rawBody, true) ?: $request->all();
            logger()->info('[LeekPay Webhook] Event received:', $payload);

            $signingSecret = env('LEEKPAY_SECRET_KEY', '');
            if (empty($signingSecret) && app()->environment('production')) {
                logger()->emergency('[LeekPay Webhook] LEEKPAY_SECRET_KEY non configurée en production.');
                return response()->json(['error' => 'Configuration serveur monétique incomplète'], 500);
            }

            if (!empty($signingSecret)) {
                $signature = $request->header('x-leekpay-signature') ?: $request->header('x-webhook-signature');
                if (!$signature) {
                    logger()->warning('[LeekPay Webhook] Signature manquante.');
                    return response()->json(['error' => 'Signature manquante'], 401);
                }

                $expected = hash_hmac('sha256', $rawBody, $signingSecret);
                if (!hash_equals(strtolower($signature), strtolower($expected))) {
                    logger()->warning('[LeekPay Webhook] Signature invalide.');
                    return response()->json(['error' => 'Signature invalide'], 403);
                }
            }

            $orderId = $payload['orderId'] ?? ($payload['order_id'] ?? ($payload['metadata']['order_id'] ?? null));
            $status = strtoupper($payload['status'] ?? ($payload['event'] ?? ''));

            if (!$orderId) {
                return response()->json(['received' => false, 'error' => 'Order ID manquant dans le webhook'], 400);
            }

            $order = Order::where('id', $orderId)->orWhere('order_number', $orderId)->first();
            if (!$order) {
                return response()->json(['received' => false, 'error' => 'Commande introuvable'], 404);
            }

            if (in_array($status, ['SUCCESS', 'COMPLETED', 'PAID', 'PAYMENT.COMPLETED'])) {
                \Illuminate\Support\Facades\DB::transaction(function () use ($orderId, $payload) {
                    $order = Order::where('id', $orderId)->orWhere('order_number', $orderId)->lockForUpdate()->first();
                    if (!$order) return;

                    // Idempotence check: do not process twice
                    if ($order->payment_status === 'PAID') {
                        logger()->info("[LeekPay Webhook] Commande {$order->order_number} déjà acquittée (idempotence).");
                        return;
                    }

                    // Verify paid amount if provided
                    $paidAmount = $payload['amount'] ?? null;
                    if ($paidAmount !== null && (float)$paidAmount < (float)$order->total) {
                        logger()->warning("[LeekPay Webhook] Montant payé ({$paidAmount}) inférieur au total ({$order->total}).");
                        return;
                    }

                    $order->update([
                        'payment_status' => 'PAID',
                        'payment_transaction_id' => $payload['transactionId'] ?? ($payload['id'] ?? null),
                        'tracking_step' => max(2, (int)$order->tracking_step),
                        'tracking_status_text' => 'Paiement confirmé, préparation en cours.',
                    ]);
                });
            }

            return response()->json(['received' => true, 'status' => 'success']);
        } catch (\Exception $e) {
            logger()->error('[LeekPay Webhook] Error: ' . $e->getMessage());
            return response()->json(['received' => false, 'error' => $e->getMessage()], 400);
        }
    }

    /**
     * SasPay Checkout Initialization
     */
    public function saspayCheckout(Request $request)
    {
        try {
            $amount = $request->input('amount');
            $currency = $request->input('currency', 'XOF');
            $description = $request->input('description', 'Commande AYMARD STORE');
            $country = $request->input('country', 'BJ');
            $customerEmail = $request->input('customerEmail') ?: 'client@aymardstore.com';
            $customerName = $request->input('customerName') ?: 'Client Aymard Store';
            $customerPhone = $request->input('customerPhone', '');
            $returnUrl = $request->input('returnUrl', '');
            $metadata = $request->input('metadata', []);
            $secretKey = $request->input('secretKey') ?: env('SASPAY_SECRET_KEY');

            if (!$amount || (float)$amount <= 0) {
                return response()->json(['success' => false, 'message' => 'Montant invalide pour la session SasPay.'], 400);
            }

            if ($secretKey) {
                try {
                    $rawAmount = is_numeric($amount) ? number_format((float)$amount, 2, '.', '') : $amount;
                    $res = Http::withHeaders([
                        'Authorization' => "Bearer {$secretKey}",
                        'Content-Type' => 'application/json'
                    ])->post('https://api.saspay.me/api/v1/checkout-sessions/', [
                        'amount' => $rawAmount,
                        'currency' => $currency ?: 'XOF',
                        'description' => $description ?: 'Commande AYMARD STORE',
                        'country' => $country ?: 'BJ',
                        'customer_email' => $customerEmail,
                        'customer_name' => $customerName,
                        'customer_phone' => $customerPhone,
                        'return_url' => $returnUrl,
                        'metadata' => $metadata
                    ]);

                    if ($res->successful()) {
                        $data = $res->json();
                        $sessionData = $data['data'] ?? $data;
                        return response()->json([
                            'success' => true,
                            'id' => $sessionData['id'] ?? null,
                            'slug' => $sessionData['slug'] ?? null,
                            'checkout_url' => $sessionData['checkout_url'] ?? null,
                            'status' => $sessionData['status'] ?? null,
                            'data' => $sessionData
                        ]);
                    }
                } catch (\Exception $sasErr) {
                    logger()->warning("[SasPay Checkout] Direct call failed: " . $sasErr->getMessage());
                }
            }

            if (app()->environment('production')) {
                logger()->emergency('[SasPay Checkout] Clé SASPAY_SECRET_KEY absente en production.');
                return response()->json([
                    'success' => false,
                    'message' => 'Passerelle SasPay temporairement indisponible en production.'
                ], 503);
            }

            // Fallback simulated session (local / sandbox only)
            $simId = 'sas_' . time() . '_' . random_int(100, 999);
            return response()->json([
                'success' => true,
                'id' => $simId,
                'slug' => 'sim_' . time(),
                'checkout_url' => url("/account?tab=orders&success=true&provider=saspay"),
                'status' => 'PENDING',
                'data' => ['id' => $simId, 'mode' => 'SIMULATED']
            ]);
        } catch (\Exception $e) {
            logger()->error('[SasPay Checkout API Error]: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Erreur lors de la création de la session de paiement SasPay'
            ], 500);
        }
    }

    /**
     * SasPay Webhook
     */
    public function saspayWebhook(Request $request)
    {
        try {
            $rawBody = $request->getContent();
            $signature = $request->header('x-webhook-signature');
            $timestamp = $request->header('x-webhook-timestamp');
            $eventType = $request->header('x-webhook-event');
            $signingSecret = env('SASPAY_SIGNING_SECRET', '');

            if (empty($signingSecret) && app()->environment('production')) {
                logger()->emergency('[SasPay Webhook] SASPAY_SIGNING_SECRET non configuré en production.');
                return response()->json(['error' => 'Configuration serveur monétique incomplète'], 500);
            }

            if (!empty($signingSecret)) {
                if (!$signature || !$timestamp) {
                    logger()->warning('[SasPay Webhook] En-têtes de signature ou timestamp manquants.');
                    return response()->json(['error' => 'Signature et timestamp requis'], 401);
                }

                $now = time();
                $timestampNum = (int)$timestamp;
                if (abs($now - $timestampNum) > 300) {
                    logger()->warning('[SasPay Webhook] Horodatage expiré (> 5 min).');
                    return response()->json(['error' => 'Horodatage expiré'], 403);
                }

                $expected = hash_hmac('sha256', "{$timestamp}.{$rawBody}", $signingSecret);
                if (!hash_equals(strtolower($signature), strtolower($expected))) {
                    logger()->warning('[SasPay Webhook] Signature invalide.');
                    return response()->json(['error' => 'Signature invalide'], 403);
                }
            }

            $payload = json_decode($rawBody, true) ?: $request->all();
            logger()->info("[SasPay Webhook] Event reçu: " . ($eventType ?? ($payload['event'] ?? 'unknown')), $payload);

            $event = $payload['event'] ?? $eventType;
            $data = $payload['data'] ?? [];

            if ($event === 'transaction.success') {
                $orderId = $data['metadata']['order_id'] ?? ($data['order_id'] ?? null);
                if ($orderId) {
                    \Illuminate\Support\Facades\DB::transaction(function () use ($orderId, $data) {
                        $order = Order::where('id', $orderId)->orWhere('order_number', $orderId)->lockForUpdate()->first();
                        if ($order && $order->payment_status !== 'PAID') {
                            $order->update([
                                'payment_status' => 'PAID',
                                'payment_transaction_id' => $data['id'] ?? null,
                                'tracking_step' => max(2, (int)$order->tracking_step),
                                'tracking_status_text' => 'Paiement SasPay validé, commande en cours.',
                            ]);
                        }
                    });
                }
            }

            return response()->json(['received' => true, 'status' => 'acknowledged']);
        } catch (\Exception $e) {
            logger()->error('[SasPay Webhook] Erreur: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Generic Moneroo / Fintech Payment Initialize
     */
    public function initialize(Request $request)
    {
        try {
            $amount = $request->input('amount');
            $currency = $request->input('currency', 'XOF');
            $description = $request->input('description');
            $customer = $request->input('customer', []);
            $orderId = $request->input('orderId');
            $returnUrl = $request->input('returnUrl', url('/account?tab=orders'));
            $secretKey = $request->input('secretKey') ?: env('MONEROO_SECRET_KEY', env('LEEKPAY_SECRET_KEY'));

            if (!$amount || (float)$amount <= 0) {
                return response()->json(['error' => 'Montant invalide'], 400);
            }

            $isoCurrency = $currency === 'FCFA' ? 'XOF' : ($currency === 'EUR' ? 'EUR' : $currency);

            if ($secretKey && strlen($secretKey) > 10 && !str_contains($secretKey, 'Demo')) {
                try {
                    $response = Http::withHeaders([
                        'Authorization' => "Bearer {$secretKey}",
                        'Content-Type' => 'application/json',
                        'Accept' => 'application/json'
                    ])->post('https://api.moneroo.io/v1/payments/initialize', [
                        'amount' => round((float)$amount),
                        'currency' => $isoCurrency,
                        'description' => $description ?: "Commande Aymard Store #{$orderId}",
                        'customer' => [
                            'email' => $customer['email'] ?? 'client@aymard-store.com',
                            'first_name' => $customer['firstname'] ?? 'Client',
                            'last_name' => $customer['lastname'] ?? 'Aymard Store',
                            'phone' => $customer['phone'] ?? ''
                        ],
                        'return_url' => $returnUrl,
                        'metadata' => [
                            'order_id' => $orderId,
                            'source' => 'AYMARD_STORE_1CLIC'
                        ]
                    ]);

                    if ($response->successful() && $response->json('data')) {
                        $data = $response->json('data');
                        return response()->json([
                            'success' => true,
                            'transactionId' => $data['id'] ?? ($data['payment_id'] ?? null),
                            'checkoutUrl' => $data['checkout_url'] ?? null,
                            'reference' => $data['reference'] ?? null,
                            'mode' => 'API_REAL'
                        ]);
                    }
                } catch (\Exception $e) {
                    logger()->warning("[Fintech Initialize] Moneroo direct call error: " . $e->getMessage());
                }
            }

            // Fallback simulator session
            $simTxId = 'tx_moneroo_' . time() . '_' . substr(md5(uniqid()), 0, 6);
            return response()->json([
                'success' => true,
                'transactionId' => $simTxId,
                'reference' => 'MNR-' . time(),
                'checkoutUrl' => null,
                'mode' => 'SIMULATION',
                'message' => 'Initialisation sécurisée du guichet de paiement'
            ]);
        } catch (\Exception $error) {
            logger()->error('Error initializing payment: ' . $error->getMessage());
            return response()->json([
                'error' => $error->getMessage() ?: 'Erreur lors de l\'initialisation du paiement'
            ], 500);
        }
    }

    /**
     * Generic Moneroo / Fintech Payment Verify
     */
    public function verify(Request $request)
    {
        try {
            $id = $request->input('paymentId') ?: $request->input('transactionId');
            if (!$id) {
                return response()->json(['success' => false, 'error' => 'Transaction / Payment ID manquant'], 400);
            }

            $secretKey = env('MONEROO_SECRET_KEY', env('LEEKPAY_SECRET_KEY', ''));

            if ($secretKey && strlen($secretKey) > 10 && !str_contains($secretKey, 'Demo')) {
                try {
                    $response = Http::withHeaders([
                        'Authorization' => "Bearer {$secretKey}",
                        'Content-Type' => 'application/json',
                        'Accept' => 'application/json'
                    ])->get("https://api.moneroo.io/v1/payments/{$id}/verify");

                    if ($response->successful() && $response->json('data')) {
                        $payment = $response->json('data');
                        $isSuccess = in_array($payment['status'] ?? '', ['success', 'completed']);
                        $isFailed = in_array($payment['status'] ?? '', ['failed', 'cancelled']);

                        return response()->json([
                            'success' => true,
                            'status' => $isSuccess ? 'PAID' : ($isFailed ? 'FAILED' : 'PENDING_PAYMENT'),
                            'monerooStatus' => $payment['status'] ?? null,
                            'amount' => $payment['amount'] ?? null,
                            'currency' => $payment['currency'] ?? null,
                            'paidAt' => $payment['created_at'] ?? null
                        ]);
                    }
                } catch (\Exception $e) {
                    logger()->warning("[Fintech Verify] Verification call error: " . $e->getMessage());
                }
            }

            // If secretKey is not configured or verification failed, do NOT return a fake PAID status
            return response()->json([
                'success' => false,
                'status' => 'UNVERIFIED',
                'message' => 'Impossible de vérifier la transaction sans passerelle active.'
            ], 422);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Generic Webhook Handler
     */
    public function webhook(Request $request)
    {
        return response()->json(['received' => true]);
    }
}
