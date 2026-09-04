<?php

namespace Tests\Feature;

use Tests\TestCase;

class LegalComplianceTest extends TestCase
{
    /**
     * 1. Test that the Privacy Policy page loads successfully and is fully compliant.
     */
    public function test_privacy_policy_page_renders_successfully(): void
    {
        $response = $this->get('/legal/privacy');
        $response->assertStatus(200);
        $response->assertSee('Legal\/Privacy', false);
    }

    /**
     * 2. Test that the Employment and Fair Recruitment page loads successfully.
     */
    public function test_employment_policy_page_renders_successfully(): void
    {
        $response = $this->get('/legal/employment');
        $response->assertStatus(200);
        $response->assertSee('Legal\/Employment', false);
    }

    /**
     * 3. Test that the Terms of Service (CGV/CGU) page loads successfully.
     */
    public function test_terms_and_conditions_page_renders_successfully(): void
    {
        $response = $this->get('/legal/terms');
        $response->assertStatus(200);
        $response->assertSee('Legal\/Terms', false);
    }

    /**
     * 4. Test that the Legal Mentions & OAPI page loads successfully.
     */
    public function test_legal_mentions_page_renders_successfully(): void
    {
        $response = $this->get('/legal/mentions');
        $response->assertStatus(200);
        $response->assertSee('Legal\/Mentions', false);
    }

    /**
     * 5. Test that all legal pages are publicly accessible without authentication.
     */
    public function test_legal_pages_are_accessible_to_unauthenticated_guests(): void
    {
        $routes = [
            '/legal/privacy',
            '/legal/employment',
            '/legal/terms',
            '/legal/mentions',
        ];

        foreach ($routes as $route) {
            $response = $this->get($route);
            $this->assertEquals(200, $response->getStatusCode(), "Route {$route} must be accessible with HTTP 200.");
        }
    }
}
