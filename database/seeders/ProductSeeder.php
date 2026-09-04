<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use Illuminate\Support\Facades\File;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = base_path('data/products.json');

        if (!File::exists($jsonPath)) {
            $this->command->warn("products.json non trouvé à {$jsonPath}");
            return;
        }

        $raw = File::get($jsonPath);
        $products = json_decode($raw, true);

        if (!is_array($products)) {
            $this->command->error("Format JSON invalide dans products.json");
            return;
        }

        $this->command->info("Seeding de " . count($products) . " produits en cours...");

        foreach ($products as $p) {
            Product::updateOrCreate(
                ['id' => $p['id']],
                [
                    'slug' => $p['slug'] ?? strtolower(preg_replace('/[^a-z0-9]+/i', '-', $p['name_fr'] ?? $p['id'])),
                    'name_fr' => $p['name_fr'] ?? 'Produit',
                    'name_en' => $p['name_en'] ?? $p['name_fr'] ?? 'Product',
                    'name_es' => $p['name_es'] ?? $p['name_fr'] ?? 'Producto',
                    'brand' => $p['brand'] ?? null,
                    'category' => $p['category'] ?? 'shoes',
                    'price' => $p['price'] ?? 99.00,
                    'compare_price' => $p['comparePrice'] ?? null,
                    'stock' => $p['stock'] ?? 45,
                    'is_new' => isset($p['isNew']) ? (bool)$p['isNew'] : true,
                    'is_featured' => isset($p['isFeatured']) ? (bool)$p['isFeatured'] : false,
                    'delivery_48h' => isset($p['delivery48H']) ? (bool)$p['delivery48H'] : true,
                    'rating' => $p['rating'] ?? 5.0,
                    'review_count' => $p['reviewCount'] ?? 0,
                    'badge' => $p['badge'] ?? null,
                    'description_fr' => $p['description_fr'] ?? '',
                    'description_en' => $p['description_en'] ?? '',
                    'description_es' => $p['description_es'] ?? '',
                    'images' => $p['images'] ?? [],
                    'colors' => $p['colors'] ?? null,
                    'sizes' => $p['sizes'] ?? null,
                    'location_prices' => $p['locationPrices'] ?? null,
                    'location_compare_prices' => $p['locationComparePrices'] ?? null,
                    'variant_type' => $p['variantType'] ?? null,
                    'variant_label' => $p['variantLabel'] ?? null,
                ]
            );
        }

        $this->command->info("Catalogue de produits importé avec succès dans SQLite !");
    }
}
