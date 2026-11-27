<?php
/**
 * Adiox — submit every sitemap URL to IndexNow (Bing, Yandex, Seznam, Naver…).
 * Bing's index feeds ChatGPT Search and Microsoft Copilot, so run this after each deploy.
 *
 * Usage (command line only, after the site is live on https://adiox.io):
 *   php tools/indexnow-submit.php            # submit all URLs in sitemap.xml
 *   php tools/indexnow-submit.php --dry-run  # print what would be sent
 *
 * The key file (<key>.txt) must be reachable at https://adiox.io/<key>.txt.
 * This folder is blocked from the web by .htaccess.
 */
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

const HOST = 'adiox.io';
$root = dirname(__DIR__);
$keyFiles = glob($root . '/[0-9a-f]*.txt') ?: [];
$keyFiles = array_values(array_filter($keyFiles, fn($f) => preg_match('/^[0-9a-f]{32}\.txt$/', basename($f))));
if (count($keyFiles) !== 1) {
    fwrite(STDERR, "Expected exactly one IndexNow key file (32 hex chars + .txt) in the site root.\n");
    exit(1);
}
$key = basename($keyFiles[0], '.txt');

$xml = @simplexml_load_file($root . '/sitemap.xml');
if (!$xml) {
    fwrite(STDERR, "Could not read sitemap.xml\n");
    exit(1);
}
$urls = [];
foreach ($xml->url as $u) {
    $urls[] = (string)$u->loc;
}

$payload = [
    'host' => HOST,
    'key' => $key,
    'keyLocation' => 'https://' . HOST . '/' . $key . '.txt',
    'urlList' => $urls,
];

if (in_array('--dry-run', $argv, true)) {
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), "\n";
    exit(0);
}

$ch = curl_init('https://api.indexnow.org/indexnow');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json; charset=utf-8'],
    CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
]);
$body = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$err = curl_error($ch);
curl_close($ch);

if ($err) {
    fwrite(STDERR, "Request failed: {$err}\n");
    exit(1);
}
// 200 = accepted, 202 = accepted (key validation pending). Anything else is an error.
echo "IndexNow responded {$status} for " . count($urls) . " URLs\n";
if ($body) echo $body, "\n";
exit(in_array($status, [200, 202], true) ? 0 : 1);
