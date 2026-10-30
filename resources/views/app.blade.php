<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover">
    <meta name="theme-color" content="#09090b">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title inertia>{{ config('app.name', 'Aymard Store | Mode, Accessoires & Plus') }}</title>
    <meta name="description" content="Aymard Store - Votre boutique en ligne pour la mode, les chaussures, sacs, bijoux, montres et accessoires. Livraison rapide partout dans le monde.">
    <meta name="keywords" content="mode, chaussures, vêtements, bijoux, montres, sacs, accessoires, boutique en ligne">

    <!-- Favicons -->
    <link rel="icon" type="image/svg+xml" href="/icon.svg">
    <link rel="icon" type="image/png" sizes="512x512" href="/icon.png">
    <link rel="shortcut icon" href="/favicon.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

    <!-- Non-render-blocking Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap" media="print" onload="this.media='all'">
    <noscript>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap">
    </noscript>

    <!-- External Gateway Scripts (Non-blocking) -->
    <script src="https://leekpay.fr/js/leekpay.js" async defer></script>

    <!-- Inertia & Vite -->
    @viteReactRefresh
    @vite(['resources/js/app.tsx'])
    @inertiaHead
  </head>
  <body class="bg-[#fcfcfc] dark:bg-[#070a13] text-[#111827] dark:text-[#f8fafc] antialiased">
    @inertia
  </body>
</html>
