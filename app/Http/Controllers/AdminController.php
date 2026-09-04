<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Product;
use App\Models\Order;
use App\Models\Setting;
use App\Models\Coupon;
use App\Models\User;

class AdminController extends Controller
{
    public function index()
    {
        $products = Product::orderBy('is_featured', 'desc')->orderBy('id', 'desc')->get();
        $orders = Order::orderBy('created_at', 'desc')->get();
        $clients = User::where('role', 'CUSTOMER')->get();
        $coupons = Coupon::all();

        return Inertia::render('Admin/Index', [
            'initialProducts' => $products,
            'initialOrders' => $orders,
            'initialClients' => $clients,
            'initialCoupons' => $coupons,
            'settings' => [
                'eurToFcfaRate' => Setting::get('eur_to_fcfa_rate', 655.957),
                'freeShippingThreshold' => Setting::get('free_shipping_threshold_eur', 150),
                'announcements' => Setting::get('announcements', []),
            ],
        ]);
    }

    public function updateOrderStatus(Request $request, string $id)
    {
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

        return response()->json(['success' => true, 'order' => $order->fresh()]);
    }

    public function updateStock(Request $request, string $id)
    {
        $product = Product::where('id', $id)->orWhere('slug', $id)->first();
        if (!$product) {
            return response()->json(['success' => false, 'error' => 'Produit introuvable.'], 404);
        }

        $product->update([
            'stock' => (int)$request->input('stock', 0)
        ]);

        return response()->json(['success' => true, 'product' => $product]);
    }

    public function saveProduct(Request $request)
    {
        $data = $request->all();
        $id = $data['id'] ?? 'prod_' . time() . '_' . random_int(100, 999);
        $data['id'] = $id;

        if (empty($data['slug'])) {
            $data['slug'] = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $data['name_fr'] ?? $id));
        }

        $product = Product::updateOrCreate(['id' => $id], $data);
        return response()->json(['success' => true, 'product' => $product]);
    }

    public function deleteProduct(string $id)
    {
        Product::where('id', $id)->orWhere('slug', $id)->delete();
        return response()->json(['success' => true]);
    }
}
