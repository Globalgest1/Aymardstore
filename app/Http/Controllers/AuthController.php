<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function showLogin()
    {
        return Inertia::render('Auth/Login');
    }

    public function showRegister()
    {
        return Inertia::render('Auth/Register');
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $email = strtolower(trim($validated['email']));
        $password = $validated['password'];

        // Attempt standard authentication with Bcrypt hash
        if (Auth::attempt(['email' => $email, 'password' => $password], true)) {
            $request->session()->regenerate();
            $user = Auth::user();
            session(['customer_email' => $user->email]);

            if ($user->role === 'ADMIN') {
                $adminUser = [
                    'id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'role' => 'ADMIN',
                    'phone' => $user->phone,
                ];
                session(['admin_user' => $adminUser]);

                if ($request->wantsJson()) {
                    return response()->json([
                        'success' => true,
                        'user' => $adminUser,
                        'redirect' => '/admin'
                    ]);
                }
                return redirect()->intended('/admin');
            }

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'user' => $user,
                    'redirect' => '/account'
                ]);
            }

            return redirect()->intended('/account');
        }

        // Authentication failed - strictly reject without fallback
        if ($request->wantsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'Identifiants de connexion incorrects.'
            ], 401);
        }

        return back()->withErrors([
            'email' => 'Identifiants de connexion incorrects.',
        ])->onlyInput('email');
    }

    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => strtolower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
            'role' => 'CUSTOMER',
        ]);

        Auth::login($user, true);
        session(['customer_email' => $user->email]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'user' => $user,
                'redirect' => '/account'
            ]);
        }

        return redirect()->route('account');
    }

    public function logout(Request $request)
    {
        session()->forget('admin_user');
        session()->forget('customer_email');
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        $cookie = cookie()->forget('aymard_admin_session');

        if ($request->wantsJson()) {
            return response()->json(['success' => true])->withCookie($cookie);
        }

        return redirect('/')->withCookie($cookie);
    }
}
