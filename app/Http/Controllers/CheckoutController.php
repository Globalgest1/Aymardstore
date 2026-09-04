<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class CheckoutController extends Controller
{
    public function index()
    {
        return redirect()->route('cart');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'customerEmail' => 'required|email',
            'shippingAddress' => 'required',
            'currency' => 'nullable|string',
            'paymentMethod' => 'nullable|string',
            'promoCodeUsed' => 'nullable|string',
        ]);

        $currency = strtoupper($validated['currency'] ?? 'EUR');
        $isFcfa = in_array($currency, ['FCFA', 'XOF']);
        $rate = (float) \App\Models\Setting::get('eur_to_fcfa_rate', 655.957);

        // 1. Verify products, stock availability, and compute true server prices
        $serverSubtotal = 0.0;
        $processedItems = [];

        foreach ($validated['items'] as $item) {
            $p = $item['product'] ?? [];
            $productId = $p['id'] ?? ($item['id'] ?? null);
            $qty = max(1, (int)($item['quantity'] ?? 1));

            if (!$productId) {
                return response()->json(['success' => false, 'error' => 'Identifiant de produit manquant dans le panier.'], 422);
            }

            $product = Product::find($productId);
            if (!$product) {
                return response()->json(['success' => false, 'error' => "Produit introuvable : {$productId}"], 404);
            }

            if ($product->stock < $qty) {
                return response()->json([
                    'success' => false,
                    'error' => "Stock insuffisant pour \"{$product->name_fr}\". Disponible : {$product->stock}, demandé : {$qty}."
                ], 422);
            }

            // Calculate unit price from database
            $unitPriceEur = (float) $product->price;
            if ($isFcfa) {
                $locPrices = is_array($product->location_prices) ? $product->location_prices : json_decode($product->location_prices ?? '[]', true);
                $unitPrice = isset($locPrices['benin']) && (float)$locPrices['benin'] > 0 
                    ? (float)$locPrices['benin'] 
                    : round($unitPriceEur * $rate);
            } else {
                $unitPrice = $unitPriceEur;
            }

            $lineTotal = $unitPrice * $qty;
            $serverSubtotal += $lineTotal;

            $processedItems[] = [
                'product_id' => $product->id,
                'product_name' => $product->name_fr,
                'quantity' => $qty,
                'price' => $unitPrice,
                'color' => $item['color'] ?? null,
                'size' => $item['size'] ?? null,
                'product' => $product->toArray(),
            ];
        }

        // 2. Validate Coupon server-side
        $discountApplied = 0.0;
        $promoCode = trim($validated['promoCodeUsed'] ?? '');
        if ($promoCode) {
            $coupon = \App\Models\Coupon::where('code', $promoCode)->where('is_active', true)->first();
            if ($coupon) {
                if ($coupon->type === 'percent') {
                    $discountApplied = round($serverSubtotal * ($coupon->value / 100), 2);
                } else {
                    $couponVal = (float)$coupon->value;
                    if ($isFcfa) {
                        $couponVal = round($couponVal * $rate);
                    }
                    $discountApplied = min($serverSubtotal, $couponVal);
                }
            } else {
                $promoCode = null;
            }
        }

        $serverTotal = max(0, $serverSubtotal - $discountApplied);

        $id = 'ord_' . time() . '_' . substr(md5(uniqid()), 0, 6);
        $orderNumber = 'AYM-' . random_int(100000, 999999);

        try {
            $order = DB::transaction(function () use ($validated, $id, $orderNumber, $serverTotal, $currency, $discountApplied, $promoCode, $processedItems, $request) {
                // 1. Pessimistic lock verification on all products
                foreach ($processedItems as $item) {
                    $lockedProduct = Product::where('id', $item['product_id'])->lockForUpdate()->first();
                    if (!$lockedProduct || $lockedProduct->stock < $item['quantity']) {
                        $avail = $lockedProduct ? $lockedProduct->stock : 0;
                        throw new \Exception("Stock insuffisant pour \"{$item['product_name']}\". Disponible : {$avail}.");
                    }
                }

                // 2. Create Order
                $createdOrder = Order::create([
                    'id' => $id,
                    'order_number' => $orderNumber,
                    'customer_email' => strtolower(trim($validated['customerEmail'])),
                    'customer_name' => $request->input('customerName') ?: ($request->input('customer_name') ?: ($validated['shippingAddress']['fullName'] ?? null)),
                    'total' => $serverTotal,
                    'currency' => $currency,
                    'discount_applied' => $discountApplied,
                    'promo_code_used' => $promoCode,
                    'status' => 'PENDING',
                    'payment_status' => 'UNPAID', // Strictly lock initial status to UNPAID
                    'payment_method' => $validated['paymentMethod'] ?? 'COD',
                    'shipping_address' => $validated['shippingAddress'],
                    'items' => $processedItems,
                    'tracking_step' => 1,
                ]);

                // 3. Create items and decrement stock
                foreach ($processedItems as $item) {
                    OrderItem::create([
                        'id' => 'item_' . time() . '_' . substr(md5(uniqid()), 0, 6),
                        'order_id' => $id,
                        'product_id' => $item['product_id'],
                        'product_name' => $item['product_name'],
                        'quantity' => $item['quantity'],
                        'price' => $item['price'],
                        'color' => $item['color'],
                        'size' => $item['size'],
                    ]);

                    // Atomically decrement stock
                    Product::where('id', $item['product_id'])->decrement('stock', $item['quantity']);
                }

                return $createdOrder;
            });

            // Dispatch notifications server-side (Merchant Telegram, Merchant Email, Customer Confirmation Email)
            try {
                \App\Services\NotificationService::sendOrderNotifications($order);
            } catch (\Exception $notifErr) {
                logger()->warning('[CheckoutController] Failed to send order notification: ' . $notifErr->getMessage());
            }

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'order' => $order,
                    'message' => 'Commande validée avec succès !'
                ]);
            }

            return redirect()->route('account')->with('success', 'Votre commande a été passée avec succès !');
        } catch (\Exception $e) {
            logger()->error('[CheckoutController Transaction Error]: ' . $e->getMessage());
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => $e->getMessage(),
                ], 422);
            }
            return back()->withErrors(['checkout' => $e->getMessage()]);
        }
    }
}
