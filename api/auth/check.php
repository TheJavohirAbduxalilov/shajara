<?php
/**
 * Check Auth Status API
 * GET /api/auth/check.php
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed', 405);
}

$auth = new Auth();

// Check share token first
$shareToken = $_GET['share'] ?? null;
if ($shareToken) {
    if ($auth->checkShareAccess($shareToken)) {
        successResponse([
            'authenticated' => true,
            'access_level' => $auth->getAccessLevel(),
            'tree_id' => $auth->getTreeId(),
            'is_shared' => true
        ]);
    } else {
        errorResponse('Invalid share link', 401);
    }
}

// Check session auth
if ($auth->check()) {
    $user = $auth->getUser();
    successResponse([
        'authenticated' => true,
        'access_level' => 'owner',
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email']
        ],
        'tree_id' => $auth->getTreeId(),
        'is_shared' => false
    ]);
}

successResponse([
    'authenticated' => false
]);
