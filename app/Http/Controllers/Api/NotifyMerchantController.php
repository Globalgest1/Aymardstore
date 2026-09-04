<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotifyMerchantController extends Controller
{
    private function isSafeExternalUrl(?string $url): bool
    {
        if (empty($url)) return false;
        $parsed = parse_url($url);
        if (!$parsed || !isset($parsed['scheme']) || !isset($parsed['host'])) {
            return false;
        }
        if (!in_array(strtolower($parsed['scheme']), ['https', 'http'])) {
            return false;
        }
        $host = strtolower($parsed['host']);
        if (in_array($host, ['localhost', '127.0.0.1', '::1', '0.0.0.0']) || str_ends_with($host, '.local') || str_ends_with($host, '.internal')) {
            return false;
        }
        $ip = gethostbyname($host);
        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return false;
        }
        return true;
    }

    public function notify(Request $request)
    {
        try {
            $data = $request->all();
            $type = $data['type'] ?? 'TEST_ALERT';
            $order = $data['order'] ?? null;
            $merchantSettings = $data['merchantSettings'] ?? [];
            $testMessage = $data['testMessage'] ?? null;

            $adminEmail = $merchantSettings['adminEmail'] ?? env('ADMIN_EMAIL', 'judesinaberogui@gmail.com');
            $emailEnabled = $merchantSettings['emailAlertsEnabled'] ?? true;
            $telegramEnabled = $merchantSettings['telegramEnabled'] ?? true;
            $whatsappEnabled = $merchantSettings['whatsappEnabled'] ?? true;
            $telegramBotToken = $merchantSettings['telegramBotToken'] ?? env('TELEGRAM_BOT_TOKEN');
            $telegramChatId = $merchantSettings['telegramChatId'] ?? env('TELEGRAM_CHAT_ID');
            $whatsappWebhookUrl = $merchantSettings['whatsappWebhookUrl'] ?? env('WHATSAPP_WEBHOOK_URL');
            $resendApiKey = $merchantSettings['resendApiKey'] ?? env('RESEND_API_KEY');

            $telegramStatus = 'Non configuré';
            $emailStatus = 'Simulé en local';

            // Handle TEST_ALERT (Anti-spam, non-breaking HTML)
            if ($type === 'TEST_ALERT') {
                $msg = $testMessage ?: 'Vos notifications marchand Aymard Store sont opérationnelles et prêtes.';

                // 1. Telegram (HTML parse mode)
                if ($telegramEnabled && $telegramBotToken && $telegramChatId) {
                    try {
                        $teleRes = Http::timeout(8)->post("https://api.telegram.org/bot{$telegramBotToken}/sendMessage", [
                            'chat_id' => $telegramChatId,
                            'text' => "<b>AYMARD STORE — TEST DES NOTIFICATIONS</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" . htmlspecialchars($msg) . "\n\n<i>Date : " . date('d/m/Y H:i:s') . "</i>",
                            'parse_mode' => 'HTML',
                        ]);
                        if ($teleRes->successful() && ($teleRes->json('ok') === true)) {
                            $telegramStatus = 'Envoyé avec succès sur Telegram';
                        } else {
                            $telegramStatus = 'Erreur Telegram: ' . ($teleRes->json('description') ?: 'Token/ChatID invalide');
                        }
                    } catch (\Exception $e) {
                        $telegramStatus = 'Erreur connexion Telegram: ' . $e->getMessage();
                    }
                }

                // 2. Email via Resend (Professional luxury template, non-spam)
                if ($emailEnabled && $resendApiKey) {
                    try {
                        $emailRes = Http::timeout(8)->withHeaders([
                            'Authorization' => "Bearer {$resendApiKey}",
                            'Content-Type' => 'application/json',
                        ])->post('https://api.resend.com/emails', [
                            'from' => \App\Services\NotificationService::getSender('notifications'),
                            'to' => [$adminEmail],
                            'subject' => 'Test des notifications marchand — Aymard Store',
                            'html' => '
                            <div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;overflow:hidden;padding:28px 24px;">
                                <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#71717a;text-transform:uppercase;margin-bottom:8px;">AYMARD STORE</div>
                                <h2 style="margin:0 0 12px 0;color:#09090b;font-size:20px;font-weight:900;">Test des notifications marchand</h2>
                                <p style="font-size:13.5px;color:#3f3f46;line-height:1.6;margin:0 0 18px 0;">' . htmlspecialchars($msg) . '</p>
                                <div style="background:#f4f4f5;border-radius:10px;padding:12px 16px;font-size:12px;color:#71717a;">
                                    Horodatage : ' . date('d/m/Y H:i:s') . ' • Canal : Resend Transactional
                                </div>
                            </div>',
                        ]);
                        if ($emailRes->successful()) {
                            $emailStatus = "Email de test transmis à {$adminEmail}";
                        } else {
                            $emailStatus = 'Erreur Resend Email: ' . ($emailRes->json('message') ?: 'Clé API Resend invalide');
                        }
                    } catch (\Exception $e) {
                        $emailStatus = 'Erreur envoi Email: ' . $e->getMessage();
                    }
                } else if ($emailEnabled) {
                    $emailStatus = "Simulation locale pour {$adminEmail}";
                }

                // 3. WhatsApp Webhook (SSRF-protected)
                if ($whatsappEnabled && $this->isSafeExternalUrl($whatsappWebhookUrl)) {
                    try {
                        Http::timeout(5)->post($whatsappWebhookUrl, ['text' => "AYMARD STORE: {$msg}"]);
                    } catch (\Exception $e) {}
                }

                return response()->json([
                    'success' => true,
                    'message' => "Rapport du test :\n• Telegram : {$telegramStatus}\n• Email : {$emailStatus}",
                ]);
            }

            // Handle NEW_ORDER via centralized NotificationService
            if ($type === 'NEW_ORDER' && $order) {
                $results = \App\Services\NotificationService::sendOrderNotifications($order, $merchantSettings);
                return response()->json([
                    'success' => true,
                    'orderId' => $order['id'] ?? null,
                    'delivery_results' => $results,
                ]);
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Notify merchant error: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }
}
