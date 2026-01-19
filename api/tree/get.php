<?php
/**
 * Get Tree Data API
 * GET /api/tree/get.php
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed', 405);
}

$auth = new Auth();
$auth->requireAuth();

$treeId = $auth->getTreeId();

if (!$treeId) {
    errorResponse('Tree not found', 404);
}

$database = new Database();
$db = $database->getConnection();

// Get all persons
$stmt = $db->prepare("
    SELECT id, given_name, patronymic, surname, surname_at_birth,
           gender, birth_day, birth_month, birth_year, birth_place, data_accuracy,
           occupation, residence, nationality,
           biography, is_root
    FROM persons
    WHERE tree_id = ?
    ORDER BY id
");
$stmt->execute([$treeId]);
$personsRaw = $stmt->fetchAll();

// Get all marriages with children
$stmt = $db->prepare("
    SELECT m.id, m.husband_id, m.wife_id
    FROM marriages m
    WHERE m.tree_id = ?
");
$stmt->execute([$treeId]);
$marriagesRaw = $stmt->fetchAll();

// Get marriage children ordered by child_order
$stmt = $db->prepare("
    SELECT mc.marriage_id, mc.child_id
    FROM marriage_children mc
    JOIN marriages m ON mc.marriage_id = m.id
    WHERE m.tree_id = ?
    ORDER BY mc.marriage_id, mc.child_order, mc.id
");
$stmt->execute([$treeId]);
$childrenRaw = $stmt->fetchAll();

// Build children map
$childrenMap = [];
foreach ($childrenRaw as $row) {
    if (!isset($childrenMap[$row['marriage_id']])) {
        $childrenMap[$row['marriage_id']] = [];
    }
    $childrenMap[$row['marriage_id']][] = 'p' . $row['child_id'];
}

// Format persons for frontend
$persons = [];
foreach ($personsRaw as $p) {
    $persons[] = [
        'id' => 'p' . $p['id'],
        'db_id' => $p['id'],
        'given_name' => $p['given_name'],
        'patronymic' => $p['patronymic'],
        'surname' => $p['surname'],
        'surname_at_birth' => $p['surname_at_birth'],
        'gender' => $p['gender'],
        'birth_day' => $p['birth_day'],
        'birth_month' => $p['birth_month'],
        'birth' => $p['birth_year'],
        'birth_place' => $p['birth_place'],
        'data_accuracy' => $p['data_accuracy'] ?? 'unknown',
        'occupation' => $p['occupation'],
        'residence' => $p['residence'],
        'nationality' => $p['nationality'],
        'biography' => $p['biography'],
        'is_root' => (bool)$p['is_root']
    ];
}

// Format marriages for frontend
$marriages = [];
foreach ($marriagesRaw as $m) {
    $marriages[] = [
        'id' => 'm' . $m['id'],
        'db_id' => $m['id'],
        'husband' => 'p' . $m['husband_id'],
        'wife' => 'p' . $m['wife_id'],
        'children' => $childrenMap[$m['id']] ?? []
    ];
}

// Get share tokens if owner
$shareTokens = null;
if ($auth->getAccessLevel() === 'owner') {
    $stmt = $db->prepare("SELECT share_edit_token, share_view_token FROM trees WHERE id = ?");
    $stmt->execute([$treeId]);
    $tokens = $stmt->fetch();
    $shareTokens = [
        'edit' => $tokens['share_edit_token'],
        'view' => $tokens['share_view_token']
    ];
}

successResponse([
    'tree_id' => $treeId,
    'persons' => $persons,
    'marriages' => $marriages,
    'access_level' => $auth->getAccessLevel(),
    'share_tokens' => $shareTokens
]);
