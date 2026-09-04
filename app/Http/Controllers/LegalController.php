<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class LegalController extends Controller
{
    /**
     * Politique de Confidentialité & Protection des Données (Code du Numérique Bénin / APDP)
     */
    public function privacy()
    {
        return Inertia::render('Legal/Privacy');
    }

    /**
     * Politique d'Emploi, Recrutement Équitable & RSE (Code du Travail Béninois)
     */
    public function employment()
    {
        return Inertia::render('Legal/Employment');
    }

    /**
     * Conditions Générales de Vente & d'Utilisation (CGV/CGU - OHADA & E-commerce Bénin)
     */
    public function terms()
    {
        return Inertia::render('Legal/Terms');
    }

    /**
     * Mentions Légales & Authenticité (RCCM, IFU, OAPI)
     */
    public function mentions()
    {
        return Inertia::render('Legal/Mentions');
    }
}
