<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class OtpController extends Controller
{
    public function send(Request $request)
    {
        try {
            $email = strtolower(trim($request->input('email', '')));

            if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Adresse email invalide'
                ], 400);
            }

            // 1. Generate cryptographically secure 6-digit code (CSPRNG)
            $otpCode = (string)random_int(100000, 999999);

            // 2. Save in Cache for 10 minutes
            Cache::put('otp_' . $email, $otpCode, now()->addMinutes(10));

            // 3. Prepare Executive Luxury HTML Email Template (Anti-Spam & Universal Client Compatibility)
            $fromSender = \App\Services\NotificationService::getSender('security');
            $htmlEmail = <<<HTML
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Code de sécurité Aymard Store</title>
              <style>
                body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
                table { border-collapse: collapse; }
                .wrapper { width: 100%; background-color: #f8fafc; padding: 40px 16px; }
                .card { max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
                .header { padding: 32px 32px 24px 32px; text-align: center; border-bottom: 1px solid #f1f5f9; }
                .brand { font-size: 20px; font-weight: 800; letter-spacing: 2.5px; text-transform: uppercase; color: #0f172a; }
                .brand-sub { font-size: 11px; font-weight: 600; color: #059669; letter-spacing: 1px; text-transform: uppercase; margin-top: 4px; }
                .content { padding: 32px; }
                .heading { font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; text-align: center; }
                .text { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0; text-align: center; }
                .code-box { background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px 0; }
                .code-value { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #0f172a; margin-left: 10px; }
                .security-note { background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 12px 16px; font-size: 12px; line-height: 1.5; color: #92400e; margin: 0 0 24px 0; }
                .footer { padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11.5px; line-height: 1.6; color: #94a3b8; }
                .footer a { color: #059669; text-decoration: none; font-weight: 600; }
              </style>
            </head>
            <body>
              <div class="wrapper">
                <table role="presentation" class="card" width="100%" align="center">
                  <tr>
                    <td class="header">
                      <div class="brand">AYMARD STORE</div>
                      <div class="brand-sub">Authentification &amp; Sécurité</div>
                    </td>
                  </tr>
                  <tr>
                    <td class="content">
                      <h1 class="heading">Votre code de vérification</h1>
                      <p class="text">
                        Une demande d'authentification a été initiée pour votre compte Aymard Store. Saisissez le code suivant pour confirmer votre identité :
                      </p>
                      <div class="code-box">
                        <span class="code-value">{$otpCode}</span>
                      </div>
                      <div class="security-note">
                        <strong>Sécurité du compte :</strong> Ce code expire dans <strong>10 minutes</strong>. L'équipe d'Aymard Store ne vous demandera jamais votre code par téléphone ou message.
                      </div>
                      <p class="text" style="margin-bottom: 0; font-size: 12.5px; color: #64748b;">
                        Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td class="footer">
                      Aymard Store — Sneakers &amp; Streetwear Authentifiés<br>
                      Cotonou, Bénin • Conciergerie WhatsApp : <a href="https://wa.me/2290197362906">+229 01 97 36 29 06</a>
                    </td>
                  </tr>
                </table>
              </div>
            </body>
            </html>
HTML;

            $emailSent = false;
            $resendApiKey = env('RESEND_API_KEY');

            if ($resendApiKey) {
                try {
                    $resendRes = Http::timeout(8)->withHeaders([
                        'Content-Type' => 'application/json',
                        'Authorization' => "Bearer {$resendApiKey}",
                    ])->post('https://api.resend.com/emails', [
                        'from' => $fromSender,
                        'to' => [$email],
                        'subject' => "Code de vérification : {$otpCode} — Aymard Store",
                        'html' => $htmlEmail,
                    ]);

                    if ($resendRes->successful() && $resendRes->json('id')) {
                        $emailSent = true;
                    }
                } catch (\Exception $e) {
                    logger()->warning('[AUTH OTP] Resend error: ' . $e->getMessage());
                }
            }

            logger()->info("[AUTH OTP] 📨 Code généré et expédié vers {$email}");

            return response()->json([
                'success' => true,
                'email' => $email,
                'emailSent' => $emailSent,
                'message' => 'Code envoyé avec succès sur votre boîte mail.'
            ]);
        } catch (\Exception $error) {
            logger()->error('Erreur API send-otp: ' . $error->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la génération du code'
            ], 500);
        }
    }

    public function verify(Request $request)
    {
        try {
            $email = strtolower(trim($request->input('email', '')));
            $code = trim($request->input('code', ''));

            if (empty($email) || empty($code)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Email et code requis'
                ], 400);
            }

            $attemptKey = 'otp_attempts_' . $email;
            $attempts = (int) Cache::get($attemptKey, 0);

            if ($attempts >= 5) {
                Cache::forget('otp_' . $email);
                Cache::forget($attemptKey);
                return response()->json([
                    'success' => false,
                    'error' => 'Nombre maximal de tentatives dépassé. Veuillez redemander un nouveau code.'
                ], 429);
            }

            $savedCode = Cache::get('otp_' . $email);

            if (!$savedCode || $savedCode !== $code) {
                $newAttempts = $attempts + 1;
                Cache::put($attemptKey, $newAttempts, now()->addMinutes(10));
                $remaining = max(0, 5 - $newAttempts);

                return response()->json([
                    'success' => false,
                    'error' => "Code incorrect ou expiré. Tentatives restantes : {$remaining}."
                ], 400);
            }

            Cache::forget('otp_' . $email);
            Cache::forget($attemptKey);

            return response()->json([
                'success' => true,
                'message' => 'Code vérifié avec succès'
            ]);
        } catch (\Exception $error) {
            logger()->error('Erreur API verify-otp: ' . $error->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la vérification du code'
            ], 500);
        }
    }
}
