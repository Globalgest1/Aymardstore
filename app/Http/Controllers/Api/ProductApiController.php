<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;

class ProductApiController extends Controller
{
    public function index()
    {
        $products = Product::orderBy('is_featured', 'desc')->orderBy('id', 'desc')->get();
        return response()->json([
            'success' => true,
            'count' => $products->count(),
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->all();
        $productsToSave = [];

        if (isset($data['products']) && is_array($data['products'])) {
            $productsToSave = $data['products'];
        } elseif (is_array($data) && array_is_list($data)) {
            $productsToSave = $data;
        } elseif (!empty($data)) {
            $productsToSave = [$data];
        }

        foreach ($productsToSave as $p) {
            $id = $p['id'] ?? 'prod_' . time() . '_' . random_int(100, 999);
            Product::updateOrCreate(
                ['id' => $id],
                [
                    'slug' => $p['slug'] ?? strtolower(preg_replace('/[^a-z0-9]+/i', '-', $p['name_fr'] ?? ($p['name'] ?? $id))),
                    'name_fr' => $p['name_fr'] ?? ($p['name'] ?? 'Produit'),
                    'name_en' => $p['name_en'] ?? ($p['name_fr'] ?? ($p['name'] ?? 'Product')),
                    'name_es' => $p['name_es'] ?? ($p['name_fr'] ?? ($p['name'] ?? 'Producto')),
                    'brand' => $p['brand'] ?? null,
                    'category' => $p['category'] ?? 'shoes',
                    'price' => $p['price'] ?? 99.00,
                    'compare_price' => $p['comparePrice'] ?? ($p['compare_price'] ?? null),
                    'stock' => $p['stock'] ?? 45,
                    'is_new' => isset($p['isNew']) ? (bool)$p['isNew'] : ($p['is_new'] ?? true),
                    'is_featured' => isset($p['isFeatured']) ? (bool)$p['isFeatured'] : ($p['is_featured'] ?? false),
                    'delivery_48h' => isset($p['delivery48H']) ? (bool)$p['delivery48H'] : ($p['delivery_48h'] ?? true),
                    'rating' => $p['rating'] ?? 5.0,
                    'review_count' => $p['reviewCount'] ?? ($p['review_count'] ?? 0),
                    'badge' => $p['badge'] ?? null,
                    'description_fr' => $p['description_fr'] ?? '',
                    'description_en' => $p['description_en'] ?? '',
                    'description_es' => $p['description_es'] ?? '',
                    'images' => $p['images'] ?? [],
                    'colors' => $p['colors'] ?? null,
                    'sizes' => $p['sizes'] ?? null,
                    'location_prices' => $p['locationPrices'] ?? ($p['location_prices'] ?? null),
                    'location_compare_prices' => $p['locationComparePrices'] ?? ($p['location_compare_prices'] ?? null),
                ]
            );
        }

        return response()->json([
            'success' => true,
            'count' => count($productsToSave),
            'message' => 'Catalogue mis à jour avec succès.',
        ]);
    }
}
