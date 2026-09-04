<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductApiController;
use App\Http\Controllers\Api\OrderApiController;
use App\Http\Controllers\Api\AdminAuthController;
use App\Http\Controllers\Api\OtpController;
use App\Http\Controllers\Api\SupportChatController;
use App\Http\Controllers\Api\PaymentApiController;
use App\Http\Controllers\Api\NotifyMerchantController;
use App\Http\Controllers\Api\BroadcastApiController;
use App\Http\Controllers\Api\AdminProductGeneratorController;

/*
|--------------------------------------------------------------------------
| API Routes - Aymard Store
|--------------------------------------------------------------------------
*/

// Products API (Public Catalog Read)
Route::get('/products', [ProductApiController::class, 'index']);

// Orders API (Store is public checkout; index, show, update are authorization-checked in controller)
Route::get('/orders', [OrderApiController::class, 'index']);
Route::post('/orders', [OrderApiController::class, 'store']);
Route::get('/orders/{id}', [OrderApiController::class, 'show']);
Route::patch('/orders/{id}', [OrderApiController::class, 'update']);

// Admin Auth API (Rate limited against brute force)
Route::post('/auth/admin-login', [AdminAuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/auth/admin-logout', [AdminAuthController::class, 'logout']);
Route::get('/auth/admin-status', [AdminAuthController::class, 'status']);

// OTP Security API (Rate limited against SMS/Email bombing and code guessing)
Route::post('/auth/send-otp', [OtpController::class, 'send'])->middleware('throttle:5,10');
Route::post('/auth/verify-otp', [OtpController::class, 'verify'])->middleware('throttle:10,5');

// Support Chat (Gemini AI Concierge - Rate limited against quota exhaustion)
Route::post('/support/chat', [SupportChatController::class, 'chat'])->middleware('throttle:30,1');

// Payment Gateways & Webhooks
Route::post('/checkout/leekpay', [PaymentApiController::class, 'leekpayCheckout']);
Route::post('/webhook/leekpay', [PaymentApiController::class, 'leekpayWebhook']);
Route::post('/checkout/saspay', [PaymentApiController::class, 'saspayCheckout']);
Route::post('/webhook/saspay', [PaymentApiController::class, 'saspayWebhook']);
Route::post('/payments/initialize', [PaymentApiController::class, 'initialize']);
Route::post('/payments/verify', [PaymentApiController::class, 'verify']);
Route::post('/payments/webhook', [PaymentApiController::class, 'webhook']);

// Protected Admin API Endpoints
Route::middleware(['admin.auth'])->group(function () {
    Route::post('/products', [ProductApiController::class, 'store']);
    Route::post('/admin/generate-product', [AdminProductGeneratorController::class, 'generate']);
    Route::post('/notify-merchant', [NotifyMerchantController::class, 'notify']);
    Route::post('/broadcast', [BroadcastApiController::class, 'broadcast']);
});

