<?php
/**
 * Marriages CRUD API
 * GET /api/marriages/ - Get all marriages
 * POST /api/marriages/ - Create marriage
 * PUT /api/marriages/?id=X - Update marriage (add/remove children)
 * DELETE /api/marriages/?id=X - Delete marriage
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';

$auth = new Auth();
$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

// GET - List all marriages
if ($method === 'GET') {
    $auth->requireAuth();
    $treeId = $auth->getTreeId();

    $stmt = $db->prepare("
        SELECT m.id, m.husband_id, m.wife_id
        FROM marriages m
        WHERE m.tree_id = ?
    ");
    $stmt->execute([$treeId]);
    $marriages = $stmt->fetchAll();

    // Get children for each marriage
    $result = [];
    foreach ($marriages as $m) {
        $stmt = $db->prepare("
            SELECT child_id, child_order FROM marriage_children WHERE marriage_id = ? ORDER BY child_order, id
        ");
        $stmt->execute([$m['id']]);
        $children = array_map(function($c) {
            return 'p' . $c['child_id'];
        }, $stmt->fetchAll());

        $result[] = [
            'id' => 'm' . $m['id'],
            'db_id' => $m['id'],
            'husband' => 'p' . $m['husband_id'],
            'wife' => 'p' . $m['wife_id'],
            'children' => $children
        ];
    }

    successResponse($result);
}

// POST - Create marriage
if ($method === 'POST') {
    $auth->requireEditAccess();
    $treeId = $auth->getTreeId();
    $data = getJsonInput();

    // Validate required fields
    if (!isset($data['husband']) || !isset($data['wife'])) {
        errorResponse('Husband and wife are required');
    }

    $husbandId = preg_replace('/^p/', '', $data['husband']);
    $wifeId = preg_replace('/^p/', '', $data['wife']);

    try {
        // Verify both persons belong to this tree
        $stmt = $db->prepare("
            SELECT id FROM persons WHERE id IN (?, ?) AND tree_id = ?
        ");
        $stmt->execute([$husbandId, $wifeId, $treeId]);
        if ($stmt->rowCount() !== 2) {
            errorResponse('Invalid husband or wife');
        }

        // Check if marriage already exists
        $stmt = $db->prepare("
            SELECT id FROM marriages
            WHERE (husband_id = ? AND wife_id = ?) OR (husband_id = ? AND wife_id = ?)
        ");
        $stmt->execute([$husbandId, $wifeId, $wifeId, $husbandId]);
        if ($stmt->fetch()) {
            errorResponse('Marriage already exists');
        }

        // Create marriage
        $stmt = $db->prepare("
            INSERT INTO marriages (tree_id, husband_id, wife_id)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$treeId, $husbandId, $wifeId]);
        $marriageId = $db->lastInsertId();

        // Add children if provided
        $children = $data['children'] ?? [];
        $childOrder = 0;
        foreach ($children as $childId) {
            $childDbId = preg_replace('/^p/', '', $childId);
            $stmt = $db->prepare("
                INSERT INTO marriage_children (marriage_id, child_id, child_order)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$marriageId, $childDbId, $childOrder]);
            $childOrder++;
        }

        // Update tree timestamp
        $stmt = $db->prepare("UPDATE trees SET updated_at = NOW() WHERE id = ?");
        $stmt->execute([$treeId]);

        successResponse([
            'id' => 'm' . $marriageId,
            'db_id' => $marriageId,
            'husband' => 'p' . $husbandId,
            'wife' => 'p' . $wifeId,
            'children' => $children
        ], 'Marriage created');

    } catch (Exception $e) {
        error_log('Marriage creation error: ' . $e->getMessage());
        errorResponse('Failed to create marriage: ' . $e->getMessage(), 500);
    }
}

// PUT - Update marriage (add/remove children)
if ($method === 'PUT') {
    $auth->requireEditAccess();
    $treeId = $auth->getTreeId();
    $data = getJsonInput();

    $marriageId = $_GET['id'] ?? $data['id'] ?? null;
    if (!$marriageId) {
        errorResponse('Marriage ID is required');
    }

    // Remove 'm' prefix if present
    $marriageId = preg_replace('/^m/', '', $marriageId);

    // Verify marriage belongs to this tree
    $stmt = $db->prepare("SELECT id FROM marriages WHERE id = ? AND tree_id = ?");
    $stmt->execute([$marriageId, $treeId]);
    if (!$stmt->fetch()) {
        errorResponse('Marriage not found', 404);
    }

    // Update children if provided (with order)
    if (isset($data['children'])) {
        // Remove all existing children
        $stmt = $db->prepare("DELETE FROM marriage_children WHERE marriage_id = ?");
        $stmt->execute([$marriageId]);

        // Add new children with order
        $childOrder = 0;
        foreach ($data['children'] as $childId) {
            $childDbId = preg_replace('/^p/', '', $childId);

            // Verify child belongs to this tree
            $stmt = $db->prepare("SELECT id FROM persons WHERE id = ? AND tree_id = ?");
            $stmt->execute([$childDbId, $treeId]);
            if ($stmt->fetch()) {
                $stmt = $db->prepare("
                    INSERT INTO marriage_children (marriage_id, child_id, child_order)
                    VALUES (?, ?, ?)
                ");
                $stmt->execute([$marriageId, $childDbId, $childOrder]);
                $childOrder++;
            }
        }
    }

    // Add single child
    if (isset($data['add_child'])) {
        $childDbId = preg_replace('/^p/', '', $data['add_child']);

        // Verify child belongs to this tree
        $stmt = $db->prepare("SELECT id FROM persons WHERE id = ? AND tree_id = ?");
        $stmt->execute([$childDbId, $treeId]);
        if ($stmt->fetch()) {
            // Check if not already a child
            $stmt = $db->prepare("
                SELECT id FROM marriage_children WHERE marriage_id = ? AND child_id = ?
            ");
            $stmt->execute([$marriageId, $childDbId]);
            if (!$stmt->fetch()) {
                // Get max order
                $stmt = $db->prepare("SELECT MAX(child_order) as max_order FROM marriage_children WHERE marriage_id = ?");
                $stmt->execute([$marriageId]);
                $maxOrder = $stmt->fetch()['max_order'] ?? -1;

                $stmt = $db->prepare("
                    INSERT INTO marriage_children (marriage_id, child_id, child_order)
                    VALUES (?, ?, ?)
                ");
                $stmt->execute([$marriageId, $childDbId, $maxOrder + 1]);
            }
        }
    }

    // Remove single child
    if (isset($data['remove_child'])) {
        $childDbId = preg_replace('/^p/', '', $data['remove_child']);
        $stmt = $db->prepare("
            DELETE FROM marriage_children WHERE marriage_id = ? AND child_id = ?
        ");
        $stmt->execute([$marriageId, $childDbId]);
    }

    // Update tree timestamp
    $stmt = $db->prepare("UPDATE trees SET updated_at = NOW() WHERE id = ?");
    $stmt->execute([$treeId]);

    // Return updated marriage
    $stmt = $db->prepare("SELECT husband_id, wife_id FROM marriages WHERE id = ?");
    $stmt->execute([$marriageId]);
    $m = $stmt->fetch();

    $stmt = $db->prepare("SELECT child_id FROM marriage_children WHERE marriage_id = ? ORDER BY child_order, id");
    $stmt->execute([$marriageId]);
    $children = array_map(function($c) {
        return 'p' . $c['child_id'];
    }, $stmt->fetchAll());

    successResponse([
        'id' => 'm' . $marriageId,
        'db_id' => $marriageId,
        'husband' => 'p' . $m['husband_id'],
        'wife' => 'p' . $m['wife_id'],
        'children' => $children
    ], 'Marriage updated');
}

// DELETE - Delete marriage
if ($method === 'DELETE') {
    $auth->requireEditAccess();
    $treeId = $auth->getTreeId();

    $marriageId = $_GET['id'] ?? null;
    if (!$marriageId) {
        errorResponse('Marriage ID is required');
    }

    // Remove 'm' prefix if present
    $marriageId = preg_replace('/^m/', '', $marriageId);

    // Verify marriage belongs to this tree
    $stmt = $db->prepare("SELECT id FROM marriages WHERE id = ? AND tree_id = ?");
    $stmt->execute([$marriageId, $treeId]);
    if (!$stmt->fetch()) {
        errorResponse('Marriage not found', 404);
    }

    // Delete marriage (cascades to marriage_children)
    $stmt = $db->prepare("DELETE FROM marriages WHERE id = ?");
    $stmt->execute([$marriageId]);

    // Update tree timestamp
    $stmt = $db->prepare("UPDATE trees SET updated_at = NOW() WHERE id = ?");
    $stmt->execute([$treeId]);

    successResponse(null, 'Marriage deleted');
}

errorResponse('Method not allowed', 405);
