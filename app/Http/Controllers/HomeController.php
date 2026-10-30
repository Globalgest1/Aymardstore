<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Product;
use App\Models\Setting;

class HomeController extends Controller
{
    public function index()
    {
        $products = Product::orderBy('is_featured', 'desc')
            ->orderBy('id', 'desc')
            ->take(16)
            ->get();

        return Inertia::render('Home', [
            'initialProducts' => $products,
            'announcements' => Setting::get('announcements', []),
            'conversionRate' => Setting::get('eur_to_fcfa_rate', 655.957),
        ]);
    }
}
