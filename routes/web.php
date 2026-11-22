<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\LegalController;
use App\Http\Controllers\Api\ProductApiController;
use App\Http\Controllers\Api\OrderApiController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\OtpController;
use App\Http\Controllers\Api\SupportChatController;
use App\Http\Controllers\Api\NotifyMerchantController;

/*
|--------------------------------------------------------------------------
| Web Routes - Aymard Store (Inertia React)
|--------------------------------------------------------------------------
*/

// Homepage
Route::get('/', [HomeController::class, 'index'])->name('home');

// Products Catalog & Details (dual support: Web HTML vs JSON API)
Route::get('/products', function (\Illuminate\Http\Request $request) {
    if ($request->wantsJson() || $request->is('api/*') || $request->header('Accept') === 'application/json') {
        return app(ProductApiController::class)->index();
    }
    return app(ProductController::class)->index($request);
})->name('products.index');

Route::get('/products/{slug}', [ProductController::class, 'show'])->name('products.show');

// Cart & Checkout
Route::get('/cart', [CartController::class, 'index'])->name('cart');
Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout');
Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');

// Customer Account & Wishlist
Route::get('/account', [AccountController::class, 'index'])->name('account');
Route::get('/account/favorites', [AccountController::class, 'favorites'])->name('account.favorites');

// Authentication (Customer & Admin)
Route::get('/auth/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/auth/register', [AuthController::class, 'showRegister'])->name('register');
Route::post('/auth/register', [AuthController::class, 'register']);
Route::any('/logout', [AuthController::class, 'logout'])->name('logout');

// Blog & Editorial
Route::get('/blog', [BlogController::class, 'index'])->name('blog.index');
Route::get('/blog/{slug}', [BlogController::class, 'show'])->name('blog.show');

// Mentions Légales & Politiques Réglementaires (Conformité République du Bénin & OHADA)
Route::get('/legal/privacy', [LegalController::class, 'privacy'])->name('legal.privacy');
Route::get('/legal/employment', [LegalController::class, 'employment'])->name('legal.employment');
Route::get('/legal/terms', [LegalController::class, 'terms'])->name('legal.terms');
Route::get('/legal/mentions', [LegalController::class, 'mentions'])->name('legal.mentions');

// Admin Back-Office (Protected by admin.auth middleware)
Route::middleware(['admin.auth'])->prefix('admin')->group(function () {
    Route::get('/', [AdminController::class, 'index'])->name('admin.index');
    Route::post('/orders/{id}/status', [AdminController::class, 'updateOrderStatus'])->name('admin.orders.status');
    Route::post('/products/{id}/stock', [AdminController::class, 'updateStock'])->name('admin.products.stock');
    Route::post('/products/save', [AdminController::class, 'saveProduct'])->name('admin.products.save');
    Route::delete('/products/{id}', [AdminController::class, 'deleteProduct'])->name('admin.products.delete');
});

// Explicit API Route Group under /api
Route::prefix('api')->group(base_path('routes/api.php'));

// Fallback direct routes to handle Vercel serverless basePath stripping
Route::post('/orders', [OrderApiController::class, 'store']);
Route::get('/orders', [OrderApiController::class, 'index']);
Route::get('/orders/{id}', [OrderApiController::class, 'show']);
Route::patch('/orders/{id}', [OrderApiController::class, 'update']);
Route::post('/auth/admin-login', [AdminAuthController::class, 'login']);
Route::post('/auth/admin-logout', [AdminAuthController::class, 'logout']);
Route::get('/auth/admin-status', [AdminAuthController::class, 'status']);
Route::post('/auth/send-otp', [OtpController::class, 'send']);
Route::post('/auth/verify-otp', [OtpController::class, 'verify']);
Route::post('/support/chat', [SupportChatController::class, 'chat']);
Route::post('/notify-merchant', [NotifyMerchantController::class, 'notify']);
