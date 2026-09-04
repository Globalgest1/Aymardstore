<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Order;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $sessionEmail = session('customer_email');
        $email = $user?->email ?: $sessionEmail;

        if (!$email) {
            return redirect()->guest('/auth/login?redirect=/account');
        }

        $orders = Order::where('customer_email', strtolower(trim($email)))
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Account/Index', [
            'initialOrders' => $orders,
        ]);
    }

    public function favorites()
    {
        return Inertia::render('Account/Favorites');
    }
}
