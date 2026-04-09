<?php
// check_configs.php - arquivo completo para incluir os arquivos em config/ fora do framework
// Cria stubs mínimos e imprime tipo/OK de cada config

// --- Helpers básicos ---
if (!function_exists('env')) {
    function env($key, $default = null) {
        $val = getenv($key);
        if ($val === false) return $default;
        $lower = strtolower($val);
        if ($lower === 'true') return true;
        if ($lower === 'false') return false;
        if (is_numeric($val)) {
            return (string)(int)$val === $val ? (int)$val : (float)$val;
        }
        return $val;
    }
}

if (!function_exists('base_path')) {
    function base_path($path = '') {
        return __DIR__ . ($path !== '' ? DIRECTORY_SEPARATOR . $path : $path);
    }
}
if (!function_exists('storage_path')) {
    function storage_path($path = '') { return base_path('storage' . ($path !== '' ? DIRECTORY_SEPARATOR . $path : $path)); }
}
if (!function_exists('app_path')) {
    function app_path($path = '') { return base_path('app' . ($path !== '' ? DIRECTORY_SEPARATOR . $path : $path)); }
}
if (!function_exists('database_path')) {
    function database_path($path = '') { return base_path('database' . ($path !== '' ? DIRECTORY_SEPARATOR . $path : $path)); }
}
if (!function_exists('config_path')) {
    function config_path($path = '') { return base_path('config' . ($path !== '' ? DIRECTORY_SEPARATOR . $path : $path)); }
}
if (!function_exists('public_path')) {
    function public_path($path = '') { return base_path('public' . ($path !== '' ? DIRECTORY_SEPARATOR . $path : $path)); }
}

// --- Minimal Illuminate\Support\Str (apenas slug usado por alguns configs) ---
if (!class_exists('MiniStr')) {
    class MiniStr {
        public static function slug($title, $separator = '-') {
            $title = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $title) ?: $title;
            $title = preg_replace('/[^A-Za-z0-9\/ _|-]+/', '', $title);
            $title = trim($title);
            $title = strtolower($title);
            $title = preg_replace('/[\/_| -]+/', $separator, $title);
            return $title;
        }
    }
}
if (!class_exists('Illuminate\\Support\\Str')) {
    class_alias('MiniStr', 'Illuminate\\Support\\Str');
}

// --- Stub mínimo para Laravel\Sanctum\Sanctum (usado por config/sanctum.php) ---
if (!class_exists('Laravel\\Sanctum\\Sanctum')) {
    eval('namespace Laravel\\Sanctum; class Sanctum {
        public static function prefix($p = null) { return $p; }
        public static function currentApplicationUrlWithPort() {
            $url = getenv("APP_URL") ?: "http://localhost";
            return $url;
        }
    }');
}

// --- Percorre e inclui cada arquivo de config, imprimindo o resultado ---
foreach (glob(__DIR__ . '/config/*.php') as $f) {
    try {
        $v = include $f;
        echo basename($f) . " => " . (is_array($v) ? 'array' : gettype($v)) . PHP_EOL;
    } catch (\Throwable $e) {
        echo "ERROR in " . basename($f) . ": " . $e->getMessage() . PHP_EOL;
    }
}