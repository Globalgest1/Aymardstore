<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AdminProductGeneratorController extends Controller
{
    private function parseNumber($val)
    {
        if (is_numeric($val) && $val > 0) return floatval($val);
        if (is_string($val)) {
            $clean = str_replace(',', '.', preg_replace('/[^0-9.,]/', '', $val));
            $num = floatval($clean);
            if ($num > 0) return $num;
        }
        return null;
    }

    public function generate(Request $request)
    {
        try {
            $apiKey = $request->input('apiKey') ?: ($request->input('geminiApiKey') ?: env('GEMINI_API_KEY'));
            if (!$apiKey) {
                return response()->json([
                    'error' => 'Clé API Gemini non configurée sur le serveur (.env ou paramètre apiKey)'
                ], 500);
            }

            $images = $request->input('images', []);
            $image = $request->input('image');
            $additionalNotes = $request->input('additionalNotes');

            $inputImages = [];
            if (is_array($images) && count($images) > 0) {
                $inputImages = array_merge($inputImages, $images);
            } elseif ($image) {
                $inputImages[] = $image;
            }

            if (empty($inputImages)) {
                return response()->json([
                    'error' => 'Veuillez fournir au moins une photo de produit.'
                ], 400);
            }

            $inlineParts = [];
            foreach (array_slice($inputImages, 0, 6) as $img) {
                $mimeType = 'image/jpeg';
                $base64Data = '';

                if (str_starts_with($img, 'data:')) {
                    if (preg_match('/^data:([^;]+);base64,(.+)$/', $img, $matches)) {
                        $mimeType = $matches[1];
                        $base64Data = $matches[2];
                    }
                } elseif (str_starts_with($img, 'http://') || str_starts_with($img, 'https://')) {
                    try {
                        $fetchRes = Http::timeout(10)->get($img);
                        if ($fetchRes->successful()) {
                            $base64Data = base64_encode($fetchRes->body());
                            $mimeType = $fetchRes->header('Content-Type') ?: 'image/jpeg';
                        }
                    } catch (\Exception $e) {
                        continue;
                    }
                } else {
                    $base64Data = $img;
                }

                if ($base64Data) {
                    $inlineParts[] = [
                        'inline_data' => [
                            'mime_type' => $mimeType,
                            'data' => $base64Data,
                        ]
                    ];
                }
            }

            $prompt = "Tu es un expert e-commerce et tarificateur mode/streetwear/luxe pour la boutique haut de gamme 'Aymard Store' (présente au Bénin et en Europe).
Analyse l'ensemble des photos fournies pour ce produit (plusieurs angles, détails, matières, logo).

Directives obligatoires :
1. \"name\" : Nom commercial complet en Français (ex: \"Nike Dunk Low Retro White Black Panda\", \"Sac Cabas Cuir Grainé\").
2. \"name_en\" : Nom en Anglais.
3. \"name_es\" : Nom en Espagnol.
4. \"brand\" : Marque précise détectée (ex: \"Nike\", \"Adidas\", \"Asics\", \"Balenciaga\", \"Zara\", \"Aymard Store\", etc.).
5. \"category\" : STRICTEMENT l'une des suivantes :
   - \"shoes\" (chaussures, baskets, sneakers, talons, bottes, mocassins)
   - \"clothing\" (vêtements, t-shirts, pulls, vestes, pantalons)
   - \"bags\" (sacs à main, sacs à dos, pochettes)
   - \"watches\" (montres)
   - \"jewelry\" (bijoux, bagues, bracelets)
   - \"necklaces\" (colliers, pendentifs)
   - \"hats\" (chapeaux, casquettes, bonnets)
   - \"socks\" (chaussettes)
   - \"accessories\" (ceintures, lunettes, écharpes)
6. \"description\" : Description vendeuse en Français (2-3 paragraphes élégants avec détails matières, style et confort).
7. \"description_en\" : Description équivalente en Anglais.
8. \"description_es\" : Description équivalente en Espagnol.
9. \"pricing\" : SUGGESTION INTELLIGENTE DES PRIX (nombres stricts sans symbole) :
   - \"price\" : Prix de vente conseillé de base en Euros (€) (ex: 129.90).
   - \"comparePrice\" : Prix barré / d'origine estimé en Euros (€) (ex: 159.00).
   - \"beninPrice\" : Prix de vente conseillé pour le marché local du Bénin en FCFA (ex: 65000 pour des sneakers ou sacs de qualité, 35000 pour des vêtements).
   - \"beninComparePrice\" : Prix barré au Bénin en FCFA (ex: 85000).
   - \"francePrice\" : Prix de vente France en Euros (€) (ex: 120.00).
   - \"franceComparePrice\" : Prix barré France en Euros (€) (ex: 140.00).
   - \"belgiquePrice\" : Prix de vente Belgique en Euros (€) (ex: 125.00).
   - \"belgiqueComparePrice\" : Prix barré Belgique en Euros (€) (ex: 145.00).
10. \"badge\" : Badge marketing conseillé (\"NEW\", \"HOT\", \"TENDANCE\", \"LIMITED\" ou \"PREMIUM\").
11. \"colors\" : Tableau de 1 à 4 noms de couleurs en Français (ex: [\"Noir\", \"Blanc\"]).
12. \"suggestedSizes\" : Tableau des variantes recommandées :
    - Pour \"shoes\" : [\"39\", \"40\", \"41\", \"42\", \"43\", \"44\", \"45\"]
    - Pour \"clothing\" : [\"XS\", \"S\", \"M\", \"L\", \"XL\", \"XXL\"]
    - Pour \"bags\" ou \"accessories\" : [\"Taille Unique\"]
13. \"variantType\" : \"pointure\" | \"taille\" | \"volume\" | \"unique\".
" . ($additionalNotes ? "\nNotes supplémentaires de l'administrateur : {$additionalNotes}" : "") . "

Réponds STRICTEMENT avec un objet JSON sans aucun formatage Markdown externe :
{
  \"name\": \"...\",
  \"name_en\": \"...\",
  \"name_es\": \"...\",
  \"brand\": \"...\",
  \"category\": \"...\",
  \"description\": \"...\",
  \"description_en\": \"...\",
  \"description_es\": \"...\",
  \"pricing\": {
    \"price\": 129.9,
    \"comparePrice\": 159.0,
    \"beninPrice\": 65000,
    \"beninComparePrice\": 85000,
    \"francePrice\": 120,
    \"franceComparePrice\": 140,
    \"belgiquePrice\": 125,
    \"belgiqueComparePrice\": 145
  },
  \"badge\": \"NEW\",
  \"colors\": [\"Noir\", \"Blanc\"],
  \"suggestedSizes\": [\"40\", \"41\", \"42\", \"43\", \"44\"],
  \"variantType\": \"pointure\"
}";

            $parts = $inlineParts;
            $parts[] = ['text' => $prompt];

            $response = Http::withHeaders(['Content-Type' => 'application/json'])
                ->timeout(30)
                ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}", [
                    'contents' => [
                        ['parts' => $parts]
                    ],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                        'temperature' => 0.3,
                    ]
                ]);

            if (!$response->successful()) {
                return response()->json([
                    'error' => 'Erreur API Gemini: ' . ($response->json('error.message') ?: 'Échec de la génération')
                ], 500);
            }

            $text = $response->json('candidates.0.content.parts.0.text') ?: '{}';
            $cleanJson = preg_replace('/^```json?/m', '', $text);
            $cleanJson = preg_replace('/```$/m', '', $cleanJson);
            $data = json_decode(trim($cleanJson), true) ?: [];

            $pricingRaw = $data['pricing'] ?? [];
            $data['pricing'] = [
                'price' => $this->parseNumber($pricingRaw['price'] ?? null) ?: 99,
                'comparePrice' => $this->parseNumber($pricingRaw['comparePrice'] ?? null),
                'beninPrice' => $this->parseNumber($pricingRaw['beninPrice'] ?? null) ?: 60000,
                'beninComparePrice' => $this->parseNumber($pricingRaw['beninComparePrice'] ?? null),
                'francePrice' => $this->parseNumber($pricingRaw['francePrice'] ?? null) ?: 99,
                'franceComparePrice' => $this->parseNumber($pricingRaw['franceComparePrice'] ?? null),
                'belgiquePrice' => $this->parseNumber($pricingRaw['belgiquePrice'] ?? null) ?: 99,
                'belgiqueComparePrice' => $this->parseNumber($pricingRaw['belgiqueComparePrice'] ?? null),
            ];

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('Admin generate-product error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage() ?: 'Erreur interne.'], 500);
        }
    }
}
