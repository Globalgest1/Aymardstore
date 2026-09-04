<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Get validated, professional sender string for emails.
     */
    public static function getSender(string $channel = 'orders'): string
    {
        $fromAddress = config('mail.from.address') ?: env('MAIL_FROM_ADDRESS');
        $fromName = config('mail.from.name') ?: env('MAIL_FROM_NAME');

        if (empty($fromName) || in_array(strtolower($fromName), ['laravel', 'example', 'default'])) {
            $fromName = 'Aymard Store';
        }

        if (!empty($fromAddress) && filter_var($fromAddress, FILTER_VALIDATE_EMAIL) && !str_ends_with(strtolower($fromAddress), '@example.com')) {
            return "{$fromName} <{$fromAddress}>";
        }

        // Standard Resend sandbox fallback
        return "{$fromName} <onboarding@resend.dev>";
    }

    /**
     * Validate against SSRF for webhooks and external calls.
     */
    public static function isSafeExternalUrl(?string $url): bool
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

    /**
     * Dispatch complete order notifications (Merchant Telegram, Merchant Email, Customer Confirmation Email, WhatsApp).
     */
    public static function sendOrderNotifications($orderData, ?array $merchantSettings = null): array
    {
        try {
            $order = is_array($orderData) ? $orderData : $orderData->toArray();
            $settings = $merchantSettings ?: [];

            $adminEmail = $settings['adminEmail'] ?? env('ADMIN_EMAIL', 'judesinaberogui@gmail.com');
            $telegramBotToken = $settings['telegramBotToken'] ?? env('TELEGRAM_BOT_TOKEN');
            $telegramChatId = $settings['telegramChatId'] ?? env('TELEGRAM_CHAT_ID');
            $whatsappWebhookUrl = $settings['whatsappWebhookUrl'] ?? env('WHATSAPP_WEBHOOK_URL');
            $resendApiKey = $settings['resendApiKey'] ?? env('RESEND_API_KEY');

            $emailEnabled = $settings['emailAlertsEnabled'] ?? true;
            $telegramEnabled = $settings['telegramEnabled'] ?? true;
            $whatsappEnabled = $settings['whatsappEnabled'] ?? true;

            $currency = strtoupper($order['currency'] ?? 'EUR');
            $isFcfa = in_array($currency, ['FCFA', 'XOF']);
            $orderTotal = floatval($order['total'] ?? 0);
            $rate = (float) \App\Models\Setting::get('eur_to_fcfa_rate', 655.957);

            $formattedTotal = $isFcfa 
                ? number_format($orderTotal, 0, ',', ' ') . ' FCFA'
                : number_format($orderTotal, 2, ',', ' ') . ' €';

            $altTotal = $isFcfa
                ? number_format($orderTotal / $rate, 2, ',', ' ') . ' €'
                : number_format(round($orderTotal * $rate), 0, ',', ' ') . ' FCFA';

            $clientName = $order['customerName'] ?? ($order['customer_name'] ?? ($order['shippingAddress']['fullName'] ?? ($order['shipping_address']['fullName'] ?? 'Client Aymard Store')));
            $clientEmail = strtolower(trim($order['customerEmail'] ?? ($order['customer_email'] ?? ($order['shippingAddress']['email'] ?? ($order['shipping_address']['email'] ?? '')))));
            $clientPhone = $order['customerPhone'] ?? ($order['customer_phone'] ?? ($order['shippingAddress']['phone'] ?? ($order['shipping_address']['phone'] ?? 'Non renseigné')));
            $clientCity = $order['shippingAddress']['city'] ?? ($order['shipping_address']['city'] ?? 'Cotonou');
            $clientCountry = $order['shippingAddress']['country'] ?? ($order['shipping_address']['country'] ?? 'Bénin');
            $clientStreet = $order['shippingAddress']['street'] ?? ($order['shipping_address']['street'] ?? 'Haie Vive');
            $cleanPhone = preg_replace('/[^0-9]/', '', $clientPhone);

            $orderNum = $order['orderNumber'] ?? ($order['order_number'] ?? ($order['id'] ?? 'AYM'));
            $paymentMethod = $order['paymentMethod'] ?? ($order['payment_method'] ?? 'COD');
            $isCod = $paymentMethod === 'COD';

            $paymentMethodName = match ($paymentMethod) {
                'COD' => 'Paiement à la livraison (Espèces ou Mobile Money)',
                'SASPAY' => 'SasPay (Mobile Money & Carte Bancaire)',
                'LEEKPAY' => 'LeekPay (Mobile Money & Carte Bancaire)',
                default => 'Paiement Sécurisé'
            };

            $paymentStatusText = match ($order['paymentStatus'] ?? ($order['payment_status'] ?? 'UNPAID')) {
                'PAID' => 'Réglé par carte / Mobile Money',
                default => ($isCod ? 'À régler à la réception' : 'En attente de règlement')
            };

            // Format items list
            $itemsHtmlRows = [];
            $itemsTelegramList = [];
            $items = $order['items'] ?? [];

            foreach ($items as $item) {
                $prod = $item['product'] ?? $item;
                $name = $prod['name_fr'] ?? ($prod['name'] ?? ($item['product_name'] ?? ($item['name'] ?? 'Sneaker Exclusive')));
                $size = $item['selectedSize'] ?? ($item['size'] ?? 'Standard');
                $color = $item['selectedColor'] ?? ($item['color'] ?? '');
                $qty = (int)($item['quantity'] ?? 1);
                $unitPrice = floatval($item['price'] ?? ($prod['price'] ?? 0));

                $formattedItemPrice = $isFcfa
                    ? number_format($unitPrice * $qty, 0, ',', ' ') . ' FCFA'
                    : number_format($unitPrice * $qty, 2, ',', ' ') . ' €';

                $sizeInfo = $size ? "Taille : {$size}" : '';
                $colorInfo = $color ? "Coloris : {$color}" : '';
                $attrStr = implode(' • ', array_filter([$sizeInfo, $colorInfo]));

                $itemsTelegramList[] = "• <b>" . htmlspecialchars($name) . "</b> (x{$qty})" . ($attrStr ? "\n  ↳ <i>" . htmlspecialchars($attrStr) . "</i>" : "");

                $img = is_array($prod['images'] ?? null) ? ($prod['images'][0] ?? '') : ($prod['images'] ?? ($item['image'] ?? ''));

                $itemsHtmlRows[] = '
                <tr>
                    <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;vertical-align:middle;">
                        ' . ($img ? '<img src="' . htmlspecialchars($img) . '" width="54" height="54" style="border-radius:10px;object-fit:cover;background:#f8fafc;display:inline-block;vertical-align:middle;margin-right:12px;border:1px solid #e2e8f0;" alt="' . htmlspecialchars($name) . '"/>' : '') . '
                        <div style="display:inline-block;vertical-align:middle;">
                            <strong style="color:#09090b;font-size:13.5px;display:block;line-height:1.4;">' . htmlspecialchars($name) . '</strong>
                            ' . ($attrStr ? '<span style="color:#71717a;font-size:12px;display:block;margin-top:2px;">' . htmlspecialchars($attrStr) . '</span>' : '') . '
                        </div>
                    </td>
                    <td style="padding:14px 12px;border-bottom:1px solid #f1f5f9;text-align:center;color:#09090b;font-weight:700;font-size:13px;vertical-align:middle;">
                        x' . $qty . '
                    </td>
                    <td style="padding:14px 16px;border-bottom:1px solid #f1f5f9;text-align:right;color:#09090b;font-weight:800;font-size:13px;vertical-align:middle;">
                        ' . htmlspecialchars($formattedItemPrice) . '
                    </td>
                </tr>';
            }

            $itemsHtml = implode('', $itemsHtmlRows);
            $itemsTelegramText = implode("\n\n", $itemsTelegramList);

            $results = [
                'telegram' => false,
                'merchant_email' => false,
                'customer_email' => false,
                'whatsapp' => false,
            ];

            // 1. Telegram Notification for Merchant (Using HTML parse_mode to eliminate Markdown parse errors)
            if ($telegramEnabled && $telegramBotToken && $telegramChatId) {
                try {
                    $telegramHtml = "<b>AYMARD STORE — NOUVELLE COMMANDE</b>\n"
                        . "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                        . "<b>N° Commande :</b> <code>#{$orderNum}</code>\n"
                        . "<b>Date :</b> " . date('d/m/Y H:i') . "\n"
                        . "<b>Statut Paiement :</b> " . htmlspecialchars($paymentStatusText) . "\n"
                        . "<b>Mode :</b> " . htmlspecialchars($paymentMethodName) . "\n\n"
                        . "👤 <b>Client :</b> " . htmlspecialchars($clientName) . "\n"
                        . "📞 <b>Téléphone :</b> <code>" . htmlspecialchars($clientPhone) . "</code>\n"
                        . "📍 <b>Adresse :</b> " . htmlspecialchars("{$clientStreet}, {$clientCity} ({$clientCountry})") . "\n"
                        . ($clientEmail ? "📧 <b>Email :</b> " . htmlspecialchars($clientEmail) . "\n" : "") . "\n"
                        . "📦 <b>Articles Commandés :</b>\n"
                        . "{$itemsTelegramText}\n\n"
                        . "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                        . "💰 <b>TOTAL : " . htmlspecialchars($formattedTotal) . "</b> (env. " . htmlspecialchars($altTotal) . ")\n"
                        . "━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
                        . ($cleanPhone ? "💬 <a href=\"https://wa.me/{$cleanPhone}\">Ouvrir la conversation WhatsApp</a>" : "");

                    $teleRes = Http::timeout(8)->post("https://api.telegram.org/bot{$telegramBotToken}/sendMessage", [
                        'chat_id' => $telegramChatId,
                        'text' => $telegramHtml,
                        'parse_mode' => 'HTML',
                        'disable_web_page_preview' => true,
                    ]);

                    $results['telegram'] = $teleRes->successful() && ($teleRes->json('ok') === true);
                    if (!$results['telegram']) {
                        Log::warning('[NotificationService] Telegram failed: ' . ($teleRes->json('description') ?? $teleRes->body()));
                    }
                } catch (\Exception $e) {
                    Log::error('[NotificationService] Telegram exception: ' . $e->getMessage());
                }
            }

            // 2. Merchant Email via Resend
            if ($emailEnabled && $resendApiKey && $adminEmail) {
                try {
                    $merchantHtml = '
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Nouvelle commande #' . htmlspecialchars($orderNum) . '</title>
                    </head>
                    <body style="margin:0;padding:24px 12px;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
                        <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;border:1px solid #e4e4e7;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.04);">
                            <div style="background-color:#09090b;padding:28px 24px;text-align:center;color:#ffffff;">
                                <div style="font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#a1a1aa;margin-bottom:6px;">AYMARD STORE LUXURY</div>
                                <h1 style="margin:0;font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.3px;">Nouvelle commande reçue</h1>
                                <div style="margin-top:6px;font-size:13px;color:#d4d4d8;">Commande <strong>#' . htmlspecialchars($orderNum) . '</strong></div>
                            </div>
                            <div style="padding:28px 24px;">
                                <div style="background-color:#fafafa;border:1px solid #f4f4f5;border-radius:12px;padding:18px;margin-bottom:24px;">
                                    <h2 style="margin:0 0 12px 0;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#71717a;font-weight:800;">Coordonnées du destinataire</h2>
                                    <p style="margin:4px 0;font-size:13.5px;color:#09090b;"><strong>Nom :</strong> ' . htmlspecialchars($clientName) . '</p>
                                    <p style="margin:4px 0;font-size:13.5px;color:#09090b;"><strong>Téléphone :</strong> <a href="tel:' . htmlspecialchars($clientPhone) . '" style="color:#09090b;font-weight:700;text-decoration:none;">' . htmlspecialchars($clientPhone) . '</a></p>
                                    <p style="margin:4px 0;font-size:13.5px;color:#09090b;"><strong>Adresse de livraison :</strong> ' . htmlspecialchars("{$clientStreet}, {$clientCity} ({$clientCountry})") . '</p>
                                    ' . ($clientEmail ? '<p style="margin:4px 0;font-size:13.5px;color:#09090b;"><strong>Email :</strong> <a href="mailto:' . htmlspecialchars($clientEmail) . '" style="color:#71717a;text-decoration:none;">' . htmlspecialchars($clientEmail) . '</a></p>' : '') . '
                                </div>

                                <h2 style="margin:0 0 12px 0;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#71717a;font-weight:800;">Détail des articles</h2>
                                <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                                    <thead>
                                        <tr style="background:#fafafa;border-bottom:1px solid #e4e4e7;">
                                            <th style="padding:10px 16px;text-align:left;font-size:11px;color:#71717a;text-transform:uppercase;font-weight:700;">Article</th>
                                            <th style="padding:10px 12px;text-align:center;font-size:11px;color:#71717a;text-transform:uppercase;font-weight:700;">Qté</th>
                                            <th style="padding:10px 16px;text-align:right;font-size:11px;color:#71717a;text-transform:uppercase;font-weight:700;">Prix</th>
                                        </tr>
                                    </thead>
                                    <tbody>' . $itemsHtml . '</tbody>
                                </table>

                                <div style="background-color:#09090b;border-radius:12px;padding:20px;text-align:center;color:#ffffff;margin-bottom:24px;">
                                    <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#a1a1aa;margin-bottom:4px;">Montant Total</div>
                                    <div style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">' . htmlspecialchars($formattedTotal) . '</div>
                                    <div style="font-size:12px;color:#a1a1aa;margin-top:4px;">' . htmlspecialchars($altTotal) . ' • ' . htmlspecialchars($paymentMethodName) . '</div>
                                </div>

                                ' . ($cleanPhone ? '
                                <div style="text-align:center;">
                                    <a href="https://wa.me/' . $cleanPhone . '" style="display:inline-block;background-color:#22c55e;color:#ffffff;text-decoration:none;font-weight:800;padding:12px 28px;border-radius:30px;font-size:13px;box-shadow:0 4px 12px rgba(34,197,94,0.25);">
                                        Contacter le client sur WhatsApp
                                    </a>
                                </div>' : '') . '
                            </div>
                            <div style="background-color:#fafafa;border-top:1px solid #f4f4f5;padding:16px 24px;text-align:center;font-size:11px;color:#71717a;">
                                Aymard Store Back-Office • Notification automatique de commande
                            </div>
                        </div>
                    </body>
                    </html>';

                    $resendRes = Http::timeout(8)->withHeaders([
                        'Authorization' => "Bearer {$resendApiKey}",
                        'Content-Type' => 'application/json',
                    ])->post('https://api.resend.com/emails', [
                        'from' => self::getSender('notifications'),
                        'to' => [$adminEmail],
                        'subject' => "Commande #{$orderNum} ({$formattedTotal}) — Aymard Store",
                        'html' => $merchantHtml,
                    ]);

                    $results['merchant_email'] = $resendRes->successful() && !empty($resendRes->json('id'));
                } catch (\Exception $e) {
                    Log::error('[NotificationService] Merchant email exception: ' . $e->getMessage());
                }
            }

            // 3. Customer Order Confirmation Email (Professional, Non-Spam, High Deliverability)
            if ($resendApiKey && !empty($clientEmail) && filter_var($clientEmail, FILTER_VALIDATE_EMAIL)) {
                try {
                    $trackingUrl = url("/account?tab=orders&order={$orderNum}");
                    $whatsappDirect = "https://wa.me/2290197362906?text=" . urlencode("Bonjour Aymard Store, je vous contacte au sujet de ma commande #{$orderNum}.");

                    $customerHtml = '
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Confirmation de commande #' . htmlspecialchars($orderNum) . '</title>
                    </head>
                    <body style="margin:0;padding:24px 12px;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
                        <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;border:1px solid #e4e4e7;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.04);">
                            <!-- Header -->
                            <div style="background-color:#09090b;padding:32px 24px;text-align:center;color:#ffffff;">
                                <div style="font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#a1a1aa;margin-bottom:8px;">AYMARD STORE</div>
                                <h1 style="margin:0;font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">Merci pour votre commande</h1>
                                <p style="margin:8px 0 0 0;font-size:13px;color:#d4d4d8;">Votre colis est en cours de préparation par notre équipe.</p>
                            </div>

                            <!-- Body -->
                            <div style="padding:28px 24px;">
                                <div style="margin-bottom:20px;font-size:14px;color:#09090b;line-height:1.6;">
                                    Bonjour <strong>' . htmlspecialchars($clientName) . '</strong>,<br/>
                                    Nous avons le plaisir de vous confirmer la bonne réception de votre commande <strong>#' . htmlspecialchars($orderNum) . '</strong>. Nos équipes vérifient l\'authenticité et soignent l\'emballage de vos articles avant expédition.
                                </div>

                                <!-- Order meta -->
                                <div style="background-color:#fafafa;border:1px solid #f4f4f5;border-radius:12px;padding:16px;margin-bottom:24px;">
                                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                                        <span style="font-size:12.5px;color:#71717a;">Numéro de commande :</span>
                                        <strong style="font-size:12.5px;color:#09090b;">#' . htmlspecialchars($orderNum) . '</strong>
                                    </div>
                                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                                        <span style="font-size:12.5px;color:#71717a;">Mode de règlement :</span>
                                        <strong style="font-size:12.5px;color:#09090b;">' . htmlspecialchars($paymentMethodName) . '</strong>
                                    </div>
                                    <div style="display:flex;justify-content:space-between;">
                                        <span style="font-size:12.5px;color:#71717a;">Statut :</span>
                                        <strong style="font-size:12.5px;color:#059669;">' . htmlspecialchars($paymentStatusText) . '</strong>
                                    </div>
                                </div>

                                <!-- Articles -->
                                <h2 style="margin:0 0 12px 0;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#71717a;font-weight:800;">Articles commandés</h2>
                                <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
                                    <thead>
                                        <tr style="background:#fafafa;border-bottom:1px solid #e4e4e7;">
                                            <th style="padding:10px 16px;text-align:left;font-size:11px;color:#71717a;text-transform:uppercase;font-weight:700;">Article</th>
                                            <th style="padding:10px 12px;text-align:center;font-size:11px;color:#71717a;text-transform:uppercase;font-weight:700;">Qté</th>
                                            <th style="padding:10px 16px;text-align:right;font-size:11px;color:#71717a;text-transform:uppercase;font-weight:700;">Prix</th>
                                        </tr>
                                    </thead>
                                    <tbody>' . $itemsHtml . '</tbody>
                                </table>

                                <!-- Total box -->
                                <div style="background-color:#09090b;border-radius:12px;padding:20px;text-align:center;color:#ffffff;margin-bottom:24px;">
                                    <div style="font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#a1a1aa;margin-bottom:4px;">Total TTC</div>
                                    <div style="font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">' . htmlspecialchars($formattedTotal) . '</div>
                                    <div style="font-size:12px;color:#a1a1aa;margin-top:4px;">Livraison 24h/48h avec suivi d\'expédition inclus</div>
                                </div>

                                <!-- Address -->
                                <div style="background-color:#fafafa;border:1px solid #f4f4f5;border-radius:12px;padding:16px;margin-bottom:24px;">
                                    <div style="font-size:12px;font-weight:800;color:#71717a;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Adresse de livraison</div>
                                    <div style="font-size:13.5px;color:#09090b;line-height:1.5;">
                                        <strong>' . htmlspecialchars($clientName) . '</strong><br/>
                                        ' . htmlspecialchars($clientStreet) . '<br/>
                                        ' . htmlspecialchars("{$clientCity}, {$clientCountry}") . '<br/>
                                        Tél : ' . htmlspecialchars($clientPhone) . '
                                    </div>
                                </div>

                                <!-- CTA -->
                                <div style="text-align:center;margin-bottom:12px;">
                                    <a href="' . htmlspecialchars($trackingUrl) . '" style="display:inline-block;background-color:#09090b;color:#ffffff;text-decoration:none;font-weight:800;padding:14px 32px;border-radius:30px;font-size:13.5px;letter-spacing:0.3px;">
                                        Suivre ma commande en direct
                                    </a>
                                </div>
                                <div style="text-align:center;">
                                    <a href="' . htmlspecialchars($whatsappDirect) . '" style="display:inline-block;color:#059669;text-decoration:none;font-weight:700;font-size:12.5px;margin-top:10px;">
                                        Besoin d\'aide ? Discuter avec notre concierge WhatsApp
                                    </a>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div style="background-color:#fafafa;border-top:1px solid #f4f4f5;padding:20px 24px;text-align:center;font-size:11.5px;color:#71717a;line-height:1.6;">
                                <strong>Aymard Store</strong> — Sneakers & Pièces Rares Authentifiées<br/>
                                Haie Vive, Cotonou, République du Bénin • Assistance : +229 01 97 36 29 06<br/>
                                <span style="font-size:10.5px;color:#a1a1aa;margin-top:6px;display:block;">Cet email est généré automatiquement suite à votre commande sur aymardstore.com.</span>
                            </div>
                        </div>
                    </body>
                    </html>';

                    $resendRes = Http::timeout(8)->withHeaders([
                        'Authorization' => "Bearer {$resendApiKey}",
                        'Content-Type' => 'application/json',
                    ])->post('https://api.resend.com/emails', [
                        'from' => self::getSender('commandes'),
                        'to' => [$clientEmail],
                        'subject' => "Confirmation de votre commande #{$orderNum} — Aymard Store",
                        'html' => $customerHtml,
                    ]);

                    $results['customer_email'] = $resendRes->successful() && !empty($resendRes->json('id'));
                } catch (\Exception $e) {
                    Log::error('[NotificationService] Customer email exception: ' . $e->getMessage());
                }
            }

            // 4. WhatsApp Webhook (SSRF Protected)
            if ($whatsappEnabled && self::isSafeExternalUrl($whatsappWebhookUrl)) {
                try {
                    $waText = "NOUVELLE COMMANDE AYMARD STORE\n"
                        . "Commande : #{$orderNum}\n"
                        . "Client : {$clientName} ({$clientPhone})\n"
                        . "Total : {$formattedTotal}\n"
                        . "Paiement : {$paymentMethodName}";

                    Http::timeout(5)->post($whatsappWebhookUrl, ['text' => $waText]);
                    $results['whatsapp'] = true;
                } catch (\Exception $e) {
                    Log::error('[NotificationService] WhatsApp webhook error: ' . $e->getMessage());
                }
            }

            Log::info("[NotificationService] Notifications processed for order #{$orderNum}", $results);
            return $results;
        } catch (\Exception $e) {
            Log::error('[NotificationService] Fatal order notification error: ' . $e->getMessage());
            return ['error' => $e->getMessage()];
        }
    }
}
