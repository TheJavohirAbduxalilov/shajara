<?php
/**
 * User Logout API
 * POST /api/auth/logout.php
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

$auth = new Auth();
$auth->destroySession();

successResponse(null, 'Logged out successfully');
