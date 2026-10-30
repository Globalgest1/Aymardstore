<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// Setup temporary directories for Vercel serverless environment
$tmpDirs = [
    '/tmp/views',
    '/tmp/sessions',
    '/tmp/cache',
];
foreach ($tmpDirs as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}

// Ensure storage paths use /tmp
putenv('VIEW_COMPILED_PATH=/tmp/views');
putenv('APP_CONFIG_CACHE=/tmp/config.php');
putenv('APP_EVENTS_CACHE=/tmp/events.php');
putenv('APP_PACKAGES_CACHE=/tmp/packages.php');
putenv('APP_ROUTES_CACHE=/tmp/routes.php');
putenv('APP_SERVICES_CACHE=/tmp/services.php');

// Delegate directly to Laravel public/index.php
require __DIR__ . '/../public/index.php';