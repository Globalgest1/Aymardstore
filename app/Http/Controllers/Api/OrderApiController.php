<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class OrderApiController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isAdmin = ($user && $user->role === 'ADMIN') || (session('admin_user.role') === 'ADMIN');

        if (!$user && !$isAdmin) {
            return response()->json([
                'success' => false,
                'error' => 'Authentification requise pour accéder aux commandes.'
            ], 401);
        }

        $query = Order::query();

        if ($isAdmin) {
            $email = $request->query('email');
            if ($email) {
                $query->where('customer_email', strtolower(trim($email)));
            }
        } else {
            // Regular customer can only access their own orders
            $query->where('customer_email', strtolower(trim($user->email)));
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'count' => $orders->count(),
            'orders' => $orders,
        ]);
    }

    public function show(Request $request, string $id)
    {
        $order = Order::where('id', $id)->orWhere('order_number', $id)->first();
        if (!$order) {
            return response()->json(['success' => false, 'error' => 'Commande introuvable.'], 404);
        }

        $user = $request->user();
        $isAdmin = ($user && $user->role === 'ADMIN') || (session('admin_user.role') === 'ADMIN');

        if (!$isAdmin && (!$user || strtolower($user->email) !== strtolower($order->customer_email))) {
            return response()->json([
                'success' => false,
                'error' => 'Accès refusé à cette commande.'
            ], 403);
        }

        return response()->json(['success' => true, 'order' => $order]);
    }

    public function store(Request $request)
    {
        $data = $request->all();
        $items = $data['items'] ?? [];

        if (empty($items)) {
            return response()->json(['success' => false, 'error' => 'Panier vide.'], 400);
        }

        $customerEmail = strtolower(trim($data['customerEmail'] ?? $data['customer_email'] ?? ''));
        if (empty($customerEmail) || !filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
            return response()->json(['success' => false, 'error' => 'Adresse email client invalide.'], 422);
        }

        $currency = strtoupper($data['currency'] ?? 'EUR');
        $isFcfa = in_array($currency, ['FCFA', 'XOF']);
        $rate = (float) \App\Models\Setting::get('eur_to_fcfa_rate', 655.957);

        // Server-side price calculation and stock validation
        $serverSubtotal = 0.0;
        $processedItems = [];

        foreach ($items as $item) {
            $p = $item['product'] ?? [];
            $productId = $p['id'] ?? ($item['id'] ?? null);
            $qty = max(1, (int)($item['quantity'] ?? 1));

            if (!$productId) {
                return response()->json(['success' => false, 'error' => 'Identifiant de produit manquant.'], 422);
            }

            $product = Product::find($productId);
            if (!$product) {
                return response()->json(['success' => false, 'error' => "Produit introuvable : {$productId}"], 404);
            }

            if ($product->stock < $qty) {
                return response()->json([
                    'success' => false,
                    'error' => "Stock insuffisant pour \"{$product->name_fr}\". Disponible : {$product->stock}."
                ], 422);
            }

            $unitPriceEur = (float) $product->price;
            if ($isFcfa) {
                $locPrices = is_array($product->location_prices) ? $product->location_prices : json_decode($product->location_prices ?? '[]', true);
                $unitPrice = isset($locPrices['benin']) && (float)$locPrices['benin'] > 0 
                    ? (float)$locPrices['benin'] 
                    : round($unitPriceEur * $rate);
            } else {
                $unitPrice = $unitPriceEur;
            }

            $serverSubtotal += $unitPrice * $qty;

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

        // Coupon calculation
        $discountApplied = 0.0;
        $promoCode = trim($data['promoCodeUsed'] ?? $data['promo_code_used'] ?? '');
        if ($promoCode) {
            $coupon = \App\Models\Coupon::where('code', $promoCode)->where('is_active', true)->first();
            if ($coupon) {
                if ($coupon->type === 'percent') {
                    $discountApplied = round($serverSubtotal * ($coupon->value / 100), 2);
                } else {
                    $couponVal = (float)$coupon->value;
                    if ($isFcfa) $couponVal = round($couponVal * $rate);
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
            $order = DB::transaction(function () use ($data, $processedItems, $id, $orderNumber, $customerEmail, $serverTotal, $currency, $discountApplied, $promoCode) {
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
                    'customer_email' => $customerEmail,
                    'customer_name' => $data['customerName'] ?? $data['customer_name'] ?? ($data['shippingAddress']['fullName'] ?? null),
                    'total' => $serverTotal,
                    'currency' => $currency,
                    'discount_applied' => $discountApplied,
                    'promo_code_used' => $promoCode,
                    'status' => 'PENDING',
                    'payment_status' => 'UNPAID', // Strictly lock initial status to UNPAID
                    'payment_method' => $data['paymentMethod'] ?? $data['payment_method'] ?? 'COD',
                    'payment_transaction_id' => null,
                    'shipping_address' => $data['shippingAddress'] ?? $data['shipping_address'] ?? [],
                    'tracking_number' => 'TRK-BJ-' . random_int(100000, 999999),
                    'items' => $processedItems,
                    'tracking_step' => 1,
                ]);

                // 3. Create items and decrement stock atomically
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

                    Product::where('id', $item['product_id'])->decrement('stock', $item['quantity']);
                }

                return $createdOrder;
            });

            // Dispatch notifications server-side (Merchant Telegram, Merchant Email, Customer Confirmation Email)
            try {
                \App\Services\NotificationService::sendOrderNotifications($order);
            } catch (\Exception $notifErr) {
                logger()->warning('[OrderApiController] Failed to send order notification: ' . $notifErr->getMessage());
            }

            return response()->json([
                'success' => true,
                'order' => $order,
                'message' => 'Commande enregistrée avec succès.',
            ]);
        } catch (\Exception $e) {
            logger()->error('[Order API Transaction Error]: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    public function update(Request $request, string $id)
    {
        $user = $request->user();
        $isAdmin = ($user && $user->role === 'ADMIN') || (session('admin_user.role') === 'ADMIN');

        if (!$isAdmin) {
            return response()->json([
                'success' => false,
                'error' => 'Accès refusé. Privilèges administrateur requis pour modifier une commande.'
            ], 403);
        }

        $order = Order::where('id', $id)->orWhere('order_number', $id)->first();
        if (!$order) {
            return response()->json(['success' => false, 'error' => 'Commande introuvable.'], 404);
        }

        $data = $request->all();
        $fields = [];
        $mappings = [
            'status' => ['status'],
            'payment_status' => ['payment_status', 'paymentStatus'],
            'tracking_number' => ['tracking_number', 'trackingNumber'],
            'carrier_name' => ['carrier_name', 'carrierName'],
            'carrier_phone' => ['carrier_phone', 'carrierPhone'],
            'current_location' => ['current_location', 'currentLocation'],
            'tracking_status_text' => ['tracking_status_text', 'trackingStatusText'],
            'tracking_step' => ['tracking_step', 'trackingStep'],
            'estimated_delivery_date' => ['estimated_delivery_date', 'estimatedDeliveryDate'],
            'tracking_history' => ['tracking_history', 'trackingHistory'],
        ];

        foreach ($mappings as $dbColumn => $keys) {
            foreach ($keys as $key) {
                if (array_key_exists($key, $data)) {
                    $fields[$dbColumn] = $data[$key];
                    break;
                }
            }
        }

        if (!empty($fields)) {
            $order->update($fields);
        }

        return response()->json([
            'success' => true,
            'order' => $order->fresh(),
            'message' => 'Statut mis à jour.'
        ]);
    }
}
