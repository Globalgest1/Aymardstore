<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AuthWorkflowTest extends TestCase
{
    public function test_customer_can_register_with_valid_data(): void
    {
        $email = 'new_customer_' . time() . '@aymardstore.com';

        $response = $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->postJson('/auth/register', [
                'name' => 'Jean Dupont',
                'email' => $email,
                'password' => 'SecurePassword123!',
            ]);

        $response->assertStatus(200);
        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => $email,
            'role' => 'CUSTOMER',
        ]);
    }

    public function test_customer_cannot_register_with_existing_email(): void
    {
        $existingEmail = 'existing_' . time() . '@aymardstore.com';
        User::create([
            'name' => 'Original User',
            'email' => $existingEmail,
            'password' => Hash::make('Password123!'),
            'role' => 'CUSTOMER',
        ]);

        $response = $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->postJson('/auth/register', [
                'name' => 'Duplicate Attempt',
                'email' => $existingEmail,
                'password' => 'NewPassword123!',
            ]);

        $response->assertStatus(422);
    }

    public function test_customer_can_login_with_valid_credentials(): void
    {
        $email = 'login_test_' . time() . '@aymardstore.com';
        User::create([
            'name' => 'Login User',
            'email' => $email,
            'password' => Hash::make('CorrectPassword123!'),
            'role' => 'CUSTOMER',
        ]);

        $response = $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->postJson('/auth/login', [
                'email' => $email,
                'password' => 'CorrectPassword123!',
            ]);

        $response->assertStatus(200);
        $this->assertAuthenticated();
        $this->assertEquals('/account', $response->json('redirect'));
    }

    public function test_admin_can_login_and_is_redirected_to_admin(): void
    {
        $admin = User::where('email', 'judesinaberogui@gmail.com')->first();
        if (!$admin) {
            $admin = User::create([
                'name' => 'Judesinaberogui',
                'email' => 'judesinaberogui@gmail.com',
                'password' => Hash::make('Mercredi12@'),
                'role' => 'ADMIN',
            ]);
        }

        $response = $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->postJson('/auth/login', [
                'email' => 'judesinaberogui@gmail.com',
                'password' => 'Mercredi12@',
            ]);

        $response->assertStatus(200);
        $this->assertAuthenticated();
        $this->assertEquals('/admin', $response->json('redirect'));
    }

    public function test_regular_customer_cannot_access_admin_portal(): void
    {
        $customer = User::create([
            'name' => 'Normal Customer',
            'email' => 'customer_' . time() . '@aymardstore.com',
            'password' => Hash::make('Password123!'),
            'role' => 'CUSTOMER',
        ]);

        $response = $this->actingAs($customer)->get('/admin');

        // Must redirect guest/unauthorized or return 401
        $this->assertTrue(in_array($response->getStatusCode(), [302, 401, 403]));
    }

    public function test_user_can_logout(): void
    {
        $user = User::create([
            'name' => 'Logout Test',
            'email' => 'logout_' . time() . '@aymardstore.com',
            'password' => Hash::make('Password123!'),
            'role' => 'CUSTOMER',
        ]);

        $response = $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->actingAs($user)
            ->post('/logout');

        $this->assertGuest();
    }
}
