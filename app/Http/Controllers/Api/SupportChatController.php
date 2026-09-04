<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\Http;

class SupportChatController extends Controller
{
    private static ?array $cachedCatalogSummary = null;

    private function getCatalogSummary(): array
    {
        if (self::$cachedCatalogSummary !== null) {
            return self::$cachedCatalogSummary;
        }

        try {
            $products = Product::query()
                ->select(['id', 'slug', 'name_fr', 'brand', 'category', 'price', 'sizes', 'colors', 'stock', 'badge', 'is_new', 'location_prices'])
                ->limit(60)
                ->get();

            self::$cachedCatalogSummary = $products->map(function ($p) {
                $locationPrices = is_array($p->location_prices) ? $p->location_prices : json_decode($p->location_prices ?? '[]', true);
                $sizes = is_array($p->sizes) ? $p->sizes : json_decode($p->sizes ?? '[]', true);
                $colors = is_array($p->colors) ? $p->colors : json_decode($p->colors ?? '[]', true);

                return [
                    'id' => $p->id,
                    'name' => $p->name_fr,
                    'brand' => $p->brand,
                    'category' => $p->category,
                    'price_eur' => $p->price,
                    'price_fcfa' => $locationPrices['benin'] ?? (round(($p->price ?? 0) * 655.957)),
                    'slug' => $p->slug,
                    'sizes' => is_array($sizes) ? array_slice($sizes, 0, 8) : [],
                    'colors' => is_array($colors) ? $colors : [],
                    'stock' => $p->stock ?? 10,
                    'badge' => $p->badge ?: ($p->is_new ? 'NEW' : null),
                ];
            })->toArray();
        } catch (\Exception $e) {
            logger()->warning('[SupportChat API] Failed to load products catalog:', ['error' => $e->getMessage()]);
            self::$cachedCatalogSummary = [];
        }

        return self::$cachedCatalogSummary ?: [];
    }

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

    public function chat(Request $request)
    {
        try {
            $message = $request->input('message');
            $image = $request->input('image');
            $history = $request->input('history', []);
            $country = $request->input('country', 'benin');

            if (empty($message) && empty($image)) {
                return response()->json(['error' => 'Message ou image requis.'], 400);
            }

            // Server-only authoritative API keys
            $apiKey = env('GEMINI_API_KEY');
            $groqKey = env('GROQ_API_KEY');

            if (!$apiKey && !$groqKey) {
                // Return high-end fallback response
                return response()->json([
                    'success' => true,
                    'text' => "Bonjour et bienvenue chez **AYMARD STORE** ! ✨\n\nJe suis votre Concierge Privé. Que puis-je faire pour vous aujourd'hui ? Que ce soit pour vérifier la disponibilité d'une paire de sneakers, choisir votre pointure ou vous orienter vers nos paiements sécurisés **LeekPay**, je suis à votre entière disposition.",
                    'detectedProduct' => null,
                    'productUrl' => null,
                    'options' => [
                        ['label' => '👟 Découvrir le Catalogue', 'action' => 'go_products'],
                        ['label' => '💬 Conseiller WhatsApp', 'action' => 'open_whatsapp']
                    ]
                ]);
            }

            $catalog = $this->getCatalogSummary();
            $isBenin = ($country === 'benin');

            // Image handling (base64 or remote URL)
            $inlineDataParts = [];
            if ($image) {
                $mimeType = 'image/jpeg';
                $base64Data = '';

                if (str_starts_with($image, 'data:')) {
                    if (preg_match('/^data:([^;]+);base64,(.+)$/', $image, $matches)) {
                        $mimeType = $matches[1];
                        $base64Data = $matches[2];
                    } else {
                        $parts = explode(',', $image);
                        $base64Data = $parts[1] ?? $image;
                    }
                } elseif (str_starts_with($image, 'http://') || str_starts_with($image, 'https://')) {
                    if ($this->isSafeExternalUrl($image)) {
                        try {
                            $imgRes = Http::timeout(6)->get($image);
                            if ($imgRes->successful()) {
                                $base64Data = base64_encode($imgRes->body());
                                $mimeType = $imgRes->header('content-type') ?: 'image/jpeg';
                            }
                        } catch (\Exception $e) {
                            logger()->warning('[SupportChat API] Failed to fetch remote image:', ['error' => $e->getMessage()]);
                        }
                    } else {
                        logger()->warning('[SupportChat API] Blocked potential SSRF attempt for image:', ['url' => $image]);
                    }
                } else {
                    $base64Data = $image;
                }

                if ($base64Data) {
                    $inlineDataParts[] = [
                        'inline_data' => [
                            'mime_type' => $mimeType,
                            'data' => $base64Data,
                        ]
                    ];
                }
            }

            // Format previous conversation context (last 6 exchanges max)
            $historyContext = '';
            if (is_array($history) && count($history) > 0) {
                $recent = array_slice($history, -6);
                $historyContext = "\nHistorique récent de l'échange avec le client :\n";
                foreach ($recent as $m) {
                    $sender = ($m['role'] ?? '') === 'user' ? 'Client' : 'Concierge Aymard';
                    $content = $m['content'] ?? '';
                    $historyContext .= "{$sender}: {$content}\n";
                }
            }

            $catalogJson = json_encode(array_slice($catalog, 0, 60), JSON_UNESCAPED_UNICODE);
            $marketCurrency = $isBenin ? 'Bénin (FCFA / XOF)' : 'International / Europe (€)';

            $systemPrompt = <<<EOT
Tu es le Concierge Intelligent et Conseiller de Vente officiel de 'AYMARD STORE', la prestigieuse boutique de sneakers authentiques, streetwear haut de gamme et maroquinerie de luxe (présente au Bénin et en Europe).

INFORMATIONS ESSENTIELLES SUR LA BOUTIQUE :
1. MOYENS DE PAIEMENT (100% SÉCURISÉS) :
   - Passerelle officielle : LEEKPAY (Mobile Money : MTN MoMo, Moov Money, Celtiis Cash, Orange Money, Wave + Cartes Bancaires : VISA, Mastercard).
   - Au Bénin : Option de Paiement à la Livraison également disponible (Cash ou Mobile Money au livreur).
   - Pas de frais cachés, transactions instantanées et chiffrées.
2. EXPÉDITION & DÉLAIS :
   - Bénin (Cotonou, Calavi, Porto-Novo, etc.) : Livraison Express en 24h à 48h.
   - International & Europe : 3 à 6 jours ouvrés par transporteur sécurisé (DHL / Colissimo International).
3. AUTHENTICITÉ & QUALITÉ :
   - 100% Neuf & Authentique, certifié par nos experts avant toute remise au client.
   - Politique exclusive : Vu le caractère limité et prestigieux des modèles, aucun retour ni échange n'est accepté. Nous guidons parfaitement le client sur le choix de sa pointure avant l'achat.
4. DEVISE & PRIX :
   - Marché actuel : {$marketCurrency}.
   - Toujours mentionner les prix en FCFA en priorité pour le Bénin (et préciser l'équivalent € si utile).

CATALOGUE PRODUITS ACTUEL DISPONIBLE (Extrait représentatif des modèles en stock) :
{$catalogJson}

DIRECTIVES POUR TA RÉPONSE :
- Si l'utilisateur envoie une PHOTO :
  1. Identifie précisément la sneaker / vêtement / sac (marque, modèle exact, silhouette, coloris, ex: "Nike Dunk Low Retro Panda", "Asics Gel-NYC", "Air Jordan 4").
  2. Vérifie si le modèle existe dans notre catalogue ou recommande le modèle le plus proche disponible.
  3. Indique clairement son tarif en FCFA (et €), les pointures disponibles, et propose d'ajouter au panier ou de passer commande.
  4. Crée un lien direct markdown si le produit est dans notre catalogue: [Voir la paire](/products/slug-du-produit).
- Si l'utilisateur pose une question texte (pointure, livraison, paiement LeekPay, disponibilité, suivi) :
  Réponds avec élégance, chaleur, précision, réactivité et professionnalisme.
- Ton : Luxueux, courtois, chaleureux, concis, orienté satisfaction client et vente.

FORMAT DE RÉPONSE STRICTEMENT EN JSON (sans backticks markdown superflus autour du JSON) :
{
  "text": "Texte de ta réponse rédigé en beau Markdown (avec emojis, listes à puces élégantes et sauts de ligne)",
  "detectedProduct": "Nom du modèle identifié (ou null si simple question générale)",
  "productUrl": "/products/slug (ou null si aucun produit spécifique)",
  "options": [
    { "label": "Texte court du bouton", "action": "go_products", "url": "/products/slug" }
  ]
}
EOT;

            $clientMessage = $message ?: "Que pensez-vous de cette photo ? Avez-vous ce modèle ?";
            $userContentParts = [];
            foreach ($inlineDataParts as $part) {
                $userContentParts[] = $part;
            }
            $userContentParts[] = [
                'text' => "{$systemPrompt}\n{$historyContext}\nMessage du client : \"{$clientMessage}\""
            ];

            $rawText = null;

            if ($apiKey) {
                // Request Gemini API
                $response = Http::withHeaders([
                    'Content-Type' => 'application/json',
                ])->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
                    'contents' => [
                        [
                            'role' => 'user',
                            'parts' => $userContentParts
                        ]
                    ],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                        'temperature' => 0.4
                    ]
                ]);

                if ($response->successful()) {
                    $rawText = $response->json('candidates.0.content.parts.0.text') ?? '{}';
                }
            }

            if (!$rawText && $groqKey) {
                // Request Groq API (fallback / high-speed LLM)
                $groqRes = Http::withHeaders([
                    'Authorization' => "Bearer {$groqKey}",
                    'Content-Type' => 'application/json'
                ])->post('https://api.groq.com/openai/v1/chat/completions', [
                    'model' => 'llama-3.3-70b-versatile',
                    'messages' => [
                        ['role' => 'system', 'content' => $systemPrompt],
                        ['role' => 'user', 'content' => $clientMessage . ($historyContext ? "\n" . $historyContext : '')]
                    ],
                    'response_format' => ['type' => 'json_object'],
                    'temperature' => 0.4
                ]);

                if ($groqRes->successful()) {
                    $rawText = $groqRes->json('choices.0.message.content') ?? '{}';
                }
            }

            if ($rawText) {
                $parsedData = json_decode($rawText, true);

                if (!is_array($parsedData)) {
                    $cleaned = preg_replace('/^```json\s*/i', '', trim($rawText));
                    $cleaned = preg_replace('/```$/i', '', $cleaned);
                    $parsedData = json_decode(trim($cleaned), true) ?: [
                        'text' => $rawText,
                        'options' => [
                            ['label' => 'Voir le Catalogue', 'action' => 'go_products'],
                            ['label' => 'Conseiller WhatsApp Direct', 'action' => 'open_whatsapp']
                        ]
                    ];
                }

                return response()->json([
                    'success' => true,
                    'text' => $parsedData['text'] ?? "Comment puis-je vous être utile chez Aymard Store aujourd'hui ?",
                    'detectedProduct' => $parsedData['detectedProduct'] ?? null,
                    'productUrl' => $parsedData['productUrl'] ?? null,
                    'options' => !empty($parsedData['options']) && is_array($parsedData['options'])
                        ? $parsedData['options']
                        : [
                            ['label' => 'Voir le Catalogue', 'action' => 'go_products'],
                            ['label' => 'Conseiller WhatsApp', 'action' => 'open_whatsapp']
                        ]
                ]);
            }

            // If API returned error, throw to catch block
            throw new \Exception("Gemini API returned code " . $response->status());
        } catch (\Exception $error) {
            logger()->error('[SupportChat API] Error in Gemini chat: ' . $error->getMessage());
            return response()->json([
                'success' => true,
                'text' => "Bienvenue chez **AYMARD STORE** ! ✨ Comment puis-je vous guider aujourd'hui dans le choix de vos sneakers, casquettes ou pièces streetwear de luxe ?",
                'detectedProduct' => null,
                'productUrl' => null,
                'options' => [
                    ['label' => '👟 Découvrir le Catalogue', 'action' => 'go_products'],
                    ['label' => '💬 Conseiller WhatsApp', 'action' => 'open_whatsapp']
                ]
            ]);
        }
    }
}
