<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AdminAuthController extends Controller
{
    public function login(Request $request)
    {
        $email = strtolower(trim($request->input('email', '')));
        $password = $request->input('password', '');

        if (empty($email) || empty($password)) {
            return response()->json([
                'success' => false,
                'error' => 'Email et mot de passe requis.'
            ], 400);
        }

        $throttleKey = 'admin_login_' . Str::transliterate(Str::lower($email) . '|' . $request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'success' => false,
                'error' => "Trop de tentatives de connexion administrateur. Veuillez patienter {$seconds} secondes."
            ], 429);
        }

        if (\Illuminate\Support\Facades\Auth::attempt(['email' => $email, 'password' => $password], true)) {
            RateLimiter::clear($throttleKey);
            $user = \Illuminate\Support\Facades\Auth::user();

            if ($user->role === 'ADMIN') {
                $request->session()->regenerate();
                $adminData = [
                    'id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'role' => 'ADMIN',
                    'phone' => $user->phone,
                ];

                session(['admin_user' => $adminData]);

                return response()->json([
                    'success' => true,
                    'user' => $adminData,
                ]);
            }

            // User is not an admin
            \Illuminate\Support\Facades\Auth::logout();
            return response()->json([
                'success' => false,
                'error' => 'Accès refusé. Privilèges administrateur requis.'
            ], 403);
        }

        RateLimiter::hit($throttleKey, 300);

        return response()->json([
            'success' => false,
            'error' => 'Identifiants administrateur invalides.'
        ], 401);
    }

    public function logout(Request $request)
    {
        session()->forget('admin_user');
        \Illuminate\Support\Facades\Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['success' => true]);
    }

    public function status(Request $request)
    {
        $user = $request->user();
        $admin = session('admin_user');

        if ($user && $user->role === 'ADMIN') {
            return response()->json([
                'authenticated' => true,
                'email' => $user->email,
                'role' => 'ADMIN',
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'role' => 'ADMIN',
                    'phone' => $user->phone,
                ]
            ]);
        }

        if (!empty($admin) && is_array($admin) && ($admin['role'] ?? '') === 'ADMIN') {
            $verifiedAdmin = \App\Models\User::where('email', $admin['email'] ?? '')->where('role', 'ADMIN')->first();
            if ($verifiedAdmin) {
                return response()->json([
                    'authenticated' => true,
                    'email' => $verifiedAdmin->email,
                    'role' => 'ADMIN',
                    'user' => [
                        'id' => $verifiedAdmin->id,
                        'email' => $verifiedAdmin->email,
                        'name' => $verifiedAdmin->name,
                        'role' => 'ADMIN',
                        'phone' => $verifiedAdmin->phone,
                    ]
                ]);
            }
        }

        return response()->json(['authenticated' => false], 401);
    }
}
