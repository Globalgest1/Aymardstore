<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BroadcastApiController extends Controller
{
    public function broadcast(Request $request)
    {
        try {
            $data = $request->all();
            $product = $data['product'] ?? null;
            $subscribers = $data['subscribers'] ?? [];
            $channels = $data['channels'] ?? [];
            $customMessage = $data['customMessage'] ?? null;
            $merchantSettings = $data['merchantSettings'] ?? [];
            $baseUrl = $data['baseUrl'] ?? config('app.url', 'http://127.0.0.1:8000');

            if (!$product) {
                return response()->json(['error' => 'Produit manquant.'], 400);
            }

            $emailSubscribers = array_filter($subscribers, function ($s) {
                return !empty($s['active']) && !empty($s['email']) && in_array('EMAIL', $s['channels'] ?? []);
            });

            $whatsappSubscribers = array_filter($subscribers, function ($s) {
                return !empty($s['active']) && !empty($s['phone']) && in_array('WHATSAPP', $s['channels'] ?? []);
            });

            $resendApiKey = $merchantSettings['resendApiKey'] ?? env('RESEND_API_KEY');
            $whatsappWebhookUrl = $merchantSettings['whatsappWebhookUrl'] ?? env('WHATSAPP_WEBHOOK_URL');

            $emailsSent = 0;
            $whatsappDispatched = 0;
            $errors = [];

            $slug = $product['slug'] ?? ($product['id'] ?? '');
            $productUrl = "{$baseUrl}/products/{$slug}";
            $price = floatval($product['price'] ?? 0);
            $formattedFcfa = number_format(round($price * 655.957), 0, ',', ' ');
            $formattedEur = number_format($price, 2, ',', ' ');

            // 1. Email Broadcast (Luxury Editorial Newsletter - Anti-Spam Compliant)
            if (in_array('EMAIL', $channels) && count($emailSubscribers) > 0) {
                $name = htmlspecialchars($product['name_fr'] ?? ($product['name'] ?? 'Pièce Exclusive'));
                $desc = htmlspecialchars($customMessage ?: ($product['description_fr'] ?? ($product['description'] ?? 'Découvrez cette nouvelle pièce exclusive sélectionnée par Aymard Store, disponible dès maintenant en stock très limité.')));
                $img = $product['images'][0] ?? '';
                $fromSender = \App\Services\NotificationService::getSender('marketing');

                $emailHtml = '
                <!DOCTYPE html>
                <html lang="fr">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Nouveauté exclusive — Aymard Store</title>
                  <style>
                    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
                    table { border-collapse: collapse; }
                    .wrapper { width: 100%; background-color: #f8fafc; padding: 36px 16px; }
                    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05); }
                    .header { padding: 32px 24px 20px 24px; text-align: center; border-bottom: 1px solid #f1f5f9; }
                    .brand { font-size: 20px; font-weight: 800; letter-spacing: 2.5px; color: #0f172a; text-transform: uppercase; }
                    .badge { display: inline-block; background: #f1f5f9; color: #0f172a; border: 1px solid #e2e8f0; font-size: 10.5px; font-weight: 700; padding: 4px 14px; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase; margin-top: 10px; }
                    .content { padding: 32px 28px; text-align: center; }
                    .product-img { width: 100%; max-width: 520px; height: 340px; object-fit: cover; border-radius: 14px; margin-bottom: 24px; border: 1px solid #f1f5f9; }
                    .product-title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0; line-height: 1.3; }
                    .product-price { font-size: 22px; font-weight: 800; color: #059669; margin-bottom: 16px; }
                    .product-desc { font-size: 14px; color: #475569; line-height: 1.6; margin: 0 auto 28px auto; max-width: 500px; }
                    .btn { display: inline-block; background: #0f172a; color: #ffffff !important; font-size: 13.5px; font-weight: 700; letter-spacing: 0.5px; padding: 14px 34px; border-radius: 30px; text-decoration: none; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15); }
                    .footer { padding: 28px 24px; text-align: center; font-size: 11.5px; line-height: 1.6; color: #94a3b8; border-top: 1px solid #f1f5f9; background-color: #fafafa; }
                    .footer a { color: #059669; text-decoration: none; font-weight: 600; }
                  </style>
                </head>
                <body>
                  <div class="wrapper">
                    <table role="presentation" class="container" width="100%" align="center">
                      <tr>
                        <td class="header">
                          <div class="brand">AYMARD STORE</div>
                          <div class="badge">Édition Sélectionnée &bull; Nouvelle Arrivée</div>
                        </td>
                      </tr>
                      <tr>
                        <td class="content">
                          ' . ($img ? '<img src="' . htmlspecialchars($img) . '" alt="' . $name . '" class="product-img" />' : '') . '
                          <h1 class="product-title">' . $name . '</h1>
                          <div class="product-price">' . $formattedFcfa . ' FCFA <span style="font-size:15px;color:#94a3b8;font-weight:500;">(' . $formattedEur . ' €)</span></div>
                          <p class="product-desc">' . $desc . '</p>
                          <div>
                            <a href="' . htmlspecialchars($productUrl) . '" class="btn">DÉCOUVRIR LA PIÈCE &rarr;</a>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td class="footer">
                          <p style="margin:0 0 6px 0;">Vous recevez cet email car vous êtes inscrit(e) aux notifications exclusives d\'Aymard Store.</p>
                          <p style="margin:0 0 10px 0;">Garantie 100% Neuf &amp; Authentique &bull; Expédition Sécurisée &bull; Conciergerie WhatsApp 7j/7</p>
                          <p style="margin:0;font-size:11px;color:#cbd5e1;">Pour gérer vos préférences ou vous désabonner, contactez notre <a href="https://wa.me/2290197362906">conciergerie</a>.</p>
                        </td>
                      </tr>
                    </table>
                  </div>
                </body>
                </html>
                ';

                if ($resendApiKey) {
                    try {
                        $recipientEmails = array_map(fn($s) => $s['email'], array_values($emailSubscribers));
                        $res = Http::timeout(8)->withHeaders([
                            'Authorization' => "Bearer {$resendApiKey}",
                            'Content-Type' => 'application/json',
                        ])->post('https://api.resend.com/emails', [
                            'from' => $fromSender,
                            'to' => array_slice($recipientEmails, 0, 50),
                            'subject' => "Nouveauté exclusive : {$name} — Aymard Store",
                            'html' => $emailHtml,
                        ]);

                        if ($res->successful()) {
                            $emailsSent = count($emailSubscribers);
                        } else {
                            $errors[] = 'Resend: ' . ($res->json('message') ?: 'Erreur API');
                        }
                    } catch (\Exception $e) {
                        $errors[] = 'Email: ' . $e->getMessage();
                    }
                } else {
                    $emailsSent = count($emailSubscribers);
                }
            }

            // 2. WhatsApp Broadcast (SSRF Protected)
            if (in_array('WHATSAPP', $channels) && \App\Services\NotificationService::isSafeExternalUrl($whatsappWebhookUrl) && count($whatsappSubscribers) > 0) {
                try {
                    $name = $product['name_fr'] ?? ($product['name'] ?? 'Pièce Exclusive');
                    $stock = $product['stock'] ?? 1;
                    $waText = "✨ *NOUVEAUTÉ — AYMARD STORE*\n\n*{$name}*\n💰 Prix : *{$formattedFcfa} FCFA* ({$formattedEur} €)\n📦 Disponibilité : *{$stock} exemplaire(s) en stock*\n\n👉 *Découvrez les détails et commandez :*\n{$productUrl}\n\n_Authenticité certifiée 100% · Livraison sécurisée · Conciergerie WhatsApp 7j/7_";

                    $recipientPhones = array_map(fn($s) => $s['phone'], array_values($whatsappSubscribers));
                    Http::timeout(5)->post($whatsappWebhookUrl, [
                        'event' => 'NEW_PRODUCT_BROADCAST',
                        'recipients' => $recipientPhones,
                        'message' => $waText,
                        'productUrl' => $productUrl,
                    ]);
                    $whatsappDispatched = count($whatsappSubscribers);
                } catch (\Exception $e) {
                    $errors[] = 'WhatsApp: ' . $e->getMessage();
                }
            }

            return response()->json([
                'success' => true,
                'emailsSent' => $emailsSent,
                'whatsappSubscribersCount' => count($whatsappSubscribers),
                'whatsappDispatched' => $whatsappDispatched,
                'errors' => !empty($errors) ? $errors : null,
            ]);
        } catch (\Exception $e) {
            Log::error('Broadcast error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage() ?: 'Erreur interne.'], 500);
        }
    }
}
