<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Setting;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Default Admin credentials (from walkthrough.md)
        User::updateOrCreate(
            ['email' => 'judesinaberogui@gmail.com'],
            [
                'name' => 'Judesinaberogui',
                'password' => Hash::make('Mercredi12@'),
                'role' => 'ADMIN',
                'phone' => '+229 01 97 36 29 06',
            ]
        );

        // Seed default store settings
        Setting::set('eur_to_fcfa_rate', 655.957);
        Setting::set('free_shipping_threshold_eur', 150);
        Setting::set('announcements', [
            '🔥 NOUVELLE COLLECTION DROP : LIVRAISON 24H/48H PARTOUT AU BÉNIN',
            '⚡ PAIEMENT SÉCURISÉ LEEKPAY : MTN MOMO, MOOV MONEY & CARTES BANCAIRES',
            '👟 TOUS NOS ARTICLES SONT 100% NEUFS ET AUTHENTIFIÉS',
        ]);

        $this->command->info("Administrateur et configurations initialisés !");
    }
}
