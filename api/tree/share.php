<?php
/**
 * Tree Sharing API
 * GET /api/tree/share.php - Get share links
 * POST /api/tree/share.php - Regenerate share links
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';

$auth = new Auth();
$auth->requireOwner();

$treeId = $auth->getTreeId();
$database = new Database();
$db = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get current share tokens
    $stmt = $db->prepare("
        SELECT share_edit_token, share_view_token
        FROM trees
        WHERE id = ?
    ");
    $stmt->execute([$treeId]);
    $tokens = $stmt->fetch();

    successResponse([
        'edit_token' => $tokens['share_edit_token'],
        'view_token' => $tokens['share_view_token']
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = getJsonInput();
    $type = $data['type'] ?? 'both'; // 'edit', 'view', or 'both'

    $updates = [];
    $params = [];

    if ($type === 'edit' || $type === 'both') {
        $updates[] = "share_edit_token = ?";
        $params[] = generateToken();
    }

    if ($type === 'view' || $type === 'both') {
        $updates[] = "share_view_token = ?";
        $params[] = generateToken();
    }

    if (empty($updates)) {
        errorResponse('Invalid type');
    }

    $params[] = $treeId;

    $stmt = $db->prepare("
        UPDATE trees
        SET " . implode(', ', $updates) . "
        WHERE id = ?
    ");
    $stmt->execute($params);

    // Return new tokens
    $stmt = $db->prepare("
        SELECT share_edit_token, share_view_token
        FROM trees
        WHERE id = ?
    ");
    $stmt->execute([$treeId]);
    $tokens = $stmt->fetch();

    successResponse([
        'edit_token' => $tokens['share_edit_token'],
        'view_token' => $tokens['share_view_token']
    ], 'Share links regenerated');
}

errorResponse('Method not allowed', 405);
