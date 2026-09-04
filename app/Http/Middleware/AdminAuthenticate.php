<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminAuthenticate
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = auth()->user();
        $adminSession = session('admin_user');

        $isAuthenticated = false;

        if ($user && $user->role === 'ADMIN') {
            $isAuthenticated = true;
            if (!$adminSession) {
                session(['admin_user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => 'ADMIN',
                    'phone' => $user->phone,
                ]]);
            }
        } elseif (!empty($adminSession) && is_array($adminSession) && ($adminSession['role'] ?? '') === 'ADMIN') {
            // Confirm the admin user actually exists in the database
            $verifiedAdmin = \App\Models\User::where('email', $adminSession['email'] ?? '')->where('role', 'ADMIN')->first();
            if ($verifiedAdmin) {
                $isAuthenticated = true;
            } else {
                session()->forget('admin_user');
            }
        }

        if (!$isAuthenticated) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'error' => 'Accès non autorisé. Session administrateur requise.'
                ], 401);
            }

            return redirect()->guest('/auth/login?redirect=/admin&unauthorized=1');
        }

        return $next($request);
    }
}
