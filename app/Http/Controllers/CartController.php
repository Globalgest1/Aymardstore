<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Setting;

class CartController extends Controller
{
    public function index()
    {
        return Inertia::render('Cart', [
            'freeShippingThreshold' => Setting::get('free_shipping_threshold_eur', 150),
            'conversionRate' => Setting::get('eur_to_fcfa_rate', 655.957),
        ]);
    }
}
