<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Product;

class ProductCatalogTest extends TestCase
{
    public function test_products_catalog_page_renders(): void
    {
        $response = $this->get('/products');
        $response->assertStatus(200);
    }

    public function test_products_filter_by_category(): void
    {
        Product::updateOrCreate(
            ['id' => 'prod_test_cat_shoes'],
            [
                'slug' => 'test-category-shoes',
                'name_fr' => 'Sneaker Test Cat',
                'category' => 'shoes',
                'price' => 120.00,
                'stock' => 5,
            ]
        );

        $response = $this->get('/products?category=shoes');
        $response->assertStatus(200);
    }

    public function test_products_filter_by_search_query(): void
    {
        Product::updateOrCreate(
            ['id' => 'prod_test_search_dunk'],
            [
                'slug' => 'nike-dunk-low-test-search',
                'name_fr' => 'Nike Dunk Low Exclusive Search',
                'brand' => 'Nike',
                'category' => 'shoes',
                'price' => 180.00,
                'stock' => 10,
            ]
        );

        $response = $this->get('/products?search=Dunk');
        $response->assertStatus(200);
    }

    public function test_product_detail_page_renders_for_valid_slug(): void
    {
        $product = Product::updateOrCreate(
            ['id' => 'prod_test_detail_valid'],
            [
                'slug' => 'jordan-4-retro-test-slug',
                'name_fr' => 'Air Jordan 4 Retro Test',
                'category' => 'shoes',
                'price' => 250.00,
                'stock' => 8,
            ]
        );

        $response = $this->get('/products/' . $product->slug);
        $response->assertStatus(200);
    }

    public function test_product_detail_aborts_404_for_invalid_slug(): void
    {
        $response = $this->get('/products/slug-inexistant-totalement-inconnu');
        $response->assertStatus(404);
    }

    public function test_api_products_returns_valid_json_catalog(): void
    {
        $response = $this->getJson('/api/products');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'count',
            'products',
        ]);
        $this->assertTrue($response->json('success'));
    }
}
