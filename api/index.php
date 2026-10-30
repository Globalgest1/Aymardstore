<?php

use IlluminateHttpRequest;

// Suppress PHP 8.5 deprecation notices from polluting output
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);

if (!defined('LARAVEL_START')) {
    define('LARAVEL_START', microtime(true));
}

// Forward HTTPS headers from Vercel proxy
if ((isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') ||
    (isset($_SERVER['HTTP_X_FORWARDED_PORT']) && $_SERVER['HTTP_X_FORWARDED_PORT'] === '443') ||
    (isset($_SERVER['HTTP_X_FORWARDED_SSL']) && $_SERVER['HTTP_X_FORWARDED_SSL'] === 'on')) {
    $_SERVER['HTTPS'] = 'on';
    $_SERVER['SERVER_PORT'] = 443;
}

// Serve static assets directly if they exist in public/
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?? '');
$publicFile = __DIR__ . '/../public' . $uri;

if ($uri !== '' && $uri !== '/' && file_exists($publicFile) && !is_dir($publicFile)) {
    $extension = strtolower(pathinfo($publicFile, PATHINFO_EXTENSION));
    $mimes = [
        'css'   => 'text/css; charset=utf-8',
        'js'    => 'application/javascript; charset=utf-8',
        'mjs'   => 'application/javascript; charset=utf-8',
        'json'  => 'application/json',
        'png'   => 'image/png',
        'jpg'   => 'image/jpeg',
        'jpeg'  => 'image/jpeg',
        'gif'   => 'image/gif',
        'svg'   => 'image/svg+xml',
        'ico'   => 'image/x-icon',
        'webp'  => 'image/webp',
        'woff'  => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf'   => 'font/ttf',
        'txt'   => 'text/plain',
    ];

    $contentType = $mimes[$extension] ?? (function_exists('mime_content_type') ? mime_content_type($publicFile) : 'application/octet-stream');

    header('Content-Type: ' . $contentType);
    if (str_starts_with($uri, '/build/')) {
        header('Cache-Control: public, max-age=31536000, immutable');
    } else {
        header('Cache-Control: public, max-age=3600');
    }
    header('Content-Length: ' . filesize($publicFile));
    readfile($publicFile);
    exit;
}

// Setup temporary directories for Vercel serverless environment
$tmpDirs = [
    '/tmp/views',
    '/tmp/sessions',
    '/tmp/cache',
    '/tmp/logs',
];
foreach ($tmpDirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Setup sqlite database in /tmp
$dbPath = '/tmp/database.sqlite';
$isNewDb = !file_exists($dbPath) || filesize($dbPath) === 0;
if ($isNewDb) {
    touch($dbPath);
}
putenv('DB_DATABASE=' . $dbPath);
putenv('DB_CONNECTION=sqlite');

// Ensure storage and cache paths use /tmp
putenv('VIEW_COMPILED_PATH=/tmp/views');
putenv('APP_CONFIG_CACHE=/tmp/config.php');
putenv('APP_EVENTS_CACHE=/tmp/events.php');
putenv('APP_PACKAGES_CACHE=/tmp/packages.php');
putenv('APP_ROUTES_CACHE=/tmp/routes.php');
putenv('APP_SERVICES_CACHE=/tmp/services.php');

// Register the Composer autoloader
require __DIR__ . '/../vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/../bootstrap/app.php';

// Force HTTPS scheme in Laravel URL generator
// Auto-migrate and seed if newly initialized
if ($isNewDb) {
    try {
        $kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
        $kernel->call('migrate', ['--force' => true]);
        $kernel->call('db:seed', ['--force' => true]);
    } catch (\Throwable $e) {
        error_log('Auto-migration notice: ' . $e->getMessage());
    }
}

// Handle HTTP request
$app->handleRequest(Request::capture());
