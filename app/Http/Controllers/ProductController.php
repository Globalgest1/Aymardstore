<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Product;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query();

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('search')) {
            $term = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($term) {
                $q->where('name_fr', 'like', $term)
                  ->orWhere('brand', 'like', $term)
                  ->orWhere('description_fr', 'like', $term);
            });
        }

        if ($request->input('filter') === 'new') {
            $query->where(function ($q) {
                $q->where('is_new', true)->orWhere('badge', 'new')->orWhere('badge', 'NEW');
            });
        } elseif ($request->input('filter') === 'deals') {
            $query->whereNotNull('compare_price')->whereColumn('compare_price', '>', 'price');
        }

        $products = $query->orderBy('is_featured', 'desc')->orderBy('id', 'desc')->take(120)->get();

        return Inertia::render('Products/Index', [
            'initialProducts' => $products,
            'filters' => (object) [
                'category' => $request->input('category'),
                'filter' => $request->input('filter'),
                'search' => $request->input('search'),
            ],
        ]);
    }

    public function show(string $slug)
    {
        $product = Product::where('slug', $slug)->orWhere('id', $slug)->first();

        if (!$product) {
            abort(404, 'Produit introuvable');
        }

        $relatedProducts = Product::where('category', $product->category)
            ->where('id', '!=', $product->id)
            ->take(8)
            ->get();

        return Inertia::render('Products/Show', [
            'slug' => $slug,
            'product' => $product,
            'relatedProducts' => $relatedProducts,
        ]);
    }
}
