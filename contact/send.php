<?php
/**
 * Adiox — contact form handler.
 *
 * Validates a POST from /contact, stores it as one JSON line in
 * storage/contact-messages.jsonl (blocked from the web by storage/.htaccess),
 * and, when the ADIOX_CONTACT_TO environment variable holds an address,
 * also emails it with PHP's mail(). Always answers with JSON.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['ok' => false, 'error' => 'Please use the contact form to send a message.']);
}

$storage = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'storage';
if (!is_dir($storage) && !mkdir($storage, 0750, true) && !is_dir($storage)) {
    respond(500, ['ok' => false, 'error' => 'We could not save your message right now. Please try again later.']);
}

// Honeypot: real visitors never fill the hidden "website" field.
if (trim((string)($_POST['website'] ?? '')) !== '') {
    respond(200, ['ok' => true]);
}

// Simple per-IP rate limit: 5 messages per 10 minutes.
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = $storage . DIRECTORY_SEPARATOR . 'contact-rate.json';
$now = time();
$rates = is_file($rateFile) ? (json_decode((string)file_get_contents($rateFile), true) ?: []) : [];
foreach ($rates as $key => $stamps) {
    $rates[$key] = array_values(array_filter((array)$stamps, fn($t) => $t > $now - 600));
    if (!$rates[$key]) unset($rates[$key]);
}
$ipKey = hash('sha256', $ip);
if (count($rates[$ipKey] ?? []) >= 5) {
    respond(429, ['ok' => false, 'error' => 'Too many messages in a short time. Please wait a few minutes and try again.']);
}

$clean = static function (string $key, int $max): string {
    $v = trim((string)($_POST[$key] ?? ''));
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    return mb_substr($v, 0, $max);
};
$name = $clean('name', 100);
$email = $clean('email', 200);
$topic = $clean('topic', 80);
$login = $clean('login', 20);
$message = $clean('message', 4000);

$topics = [
    'Account & login', 'Wallet, deposits & withdrawals', 'Identity verification (KYC)',
    'Challenges & funded accounts', 'Tournaments', 'Trading games', 'Training Room',
    'Rewards & referrals', 'Something else',
];

$errors = [];
if (mb_strlen($name) < 2) $errors['name'] = 'Please enter your name.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Please enter a valid email address.';
if (!in_array($topic, $topics, true)) $errors['topic'] = 'Please choose a topic.';
if ($login !== '' && !preg_match('/^[0-9]{3,20}$/', $login)) $errors['login'] = 'A trading login contains digits only.';
if (mb_strlen($message) < 20) $errors['message'] = 'Please write at least 20 characters so we can help.';
if ($errors) {
    respond(422, ['ok' => false, 'error' => 'Please check the highlighted fields.', 'fields' => $errors]);
}

$record = [
    'received_at' => gmdate('c'),
    'name' => $name,
    'email' => $email,
    'topic' => $topic,
    'login' => $login,
    'message' => $message,
    'ip_hash' => $ipKey,
    'user_agent' => mb_substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 300),
];
$line = json_encode($record, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;
if (file_put_contents($storage . DIRECTORY_SEPARATOR . 'contact-messages.jsonl', $line, FILE_APPEND | LOCK_EX) === false) {
    respond(500, ['ok' => false, 'error' => 'We could not save your message right now. Please try again later.']);
}

$rates[$ipKey][] = $now;
file_put_contents($rateFile, json_encode($rates), LOCK_EX);

$to = getenv('ADIOX_CONTACT_TO') ?: '';
if ($to !== '' && filter_var($to, FILTER_VALIDATE_EMAIL)) {
    $subject = '=?UTF-8?B?' . base64_encode('[Adiox contact] ' . $topic) . '?=';
    $body = "Name: {$name}\nEmail: {$email}\nTopic: {$topic}\nLogin: " . ($login ?: '-') . "\n\n{$message}\n";
    $headers = "Content-Type: text/plain; charset=UTF-8\r\nReply-To: {$email}";
    @mail($to, $subject, $body, $headers);
}

respond(200, ['ok' => true]);
