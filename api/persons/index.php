<?php
/**
 * Persons CRUD API
 * GET /api/persons/ - Get all persons
 * POST /api/persons/ - Create person
 * PUT /api/persons/?id=X - Update person
 * DELETE /api/persons/?id=X - Delete person
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';

$auth = new Auth();
$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

// GET - List all persons
if ($method === 'GET') {
    $auth->requireAuth();
    $treeId = $auth->getTreeId();

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
    $persons = $stmt->fetchAll();

    // Format for frontend
    $result = array_map(function($p) {
        return [
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
    }, $persons);

    successResponse($result);
}

// POST - Create person
if ($method === 'POST') {
    $auth->requireEditAccess();
    $treeId = $auth->getTreeId();
    $data = getJsonInput();

    $givenName = isset($data['given_name']) ? trim($data['given_name']) : null;
    $patronymic = isset($data['patronymic']) ? trim($data['patronymic']) : null;
    $surname = isset($data['surname']) ? trim($data['surname']) : null;
    $surnameAtBirth = isset($data['surname_at_birth']) ? trim($data['surname_at_birth']) : null;
    $gender = $data['gender'] ?? null;
    $birthDay = isset($data['birth_day']) && $data['birth_day'] !== '' ? (int)$data['birth_day'] : null;
    $birthMonth = isset($data['birth_month']) && $data['birth_month'] !== '' ? (int)$data['birth_month'] : null;
    $birthYear = isset($data['birth']) && $data['birth'] !== '' ? (int)$data['birth'] : null;
    $birthPlace = isset($data['birth_place']) ? trim($data['birth_place']) : null;
    $dataAccuracy = isset($data['data_accuracy']) ? $data['data_accuracy'] : 'unknown';
    $occupation = isset($data['occupation']) ? trim($data['occupation']) : null;
    $residence = isset($data['residence']) ? trim($data['residence']) : null;
    $nationality = isset($data['nationality']) ? trim($data['nationality']) : null;
    $biography = $data['biography'] ?? null;

    // Validate gender
    if ($gender !== null && !in_array($gender, ['male', 'female'])) {
        $gender = null;
    }
    if (!in_array($dataAccuracy, ['unknown', 'assumed', 'relative', 'confirmed'], true)) {
        $dataAccuracy = 'unknown';
    }

    try {
        $stmt = $db->prepare("
            INSERT INTO persons (
                tree_id, given_name, patronymic, surname, surname_at_birth,
                gender, birth_day, birth_month,
                birth_year, birth_place, data_accuracy,
                occupation, residence, nationality,
                biography
            )
            VALUES (
                ?, ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?
            )
        ");
        $stmt->execute([
            $treeId, $givenName, $patronymic, $surname, $surnameAtBirth,
            $gender, $birthDay, $birthMonth,
            $birthYear, $birthPlace, $dataAccuracy,
            $occupation, $residence, $nationality,
            $biography
        ]);
        $personId = $db->lastInsertId();

        // Update tree timestamp
        $stmt = $db->prepare("UPDATE trees SET updated_at = NOW() WHERE id = ?");
        $stmt->execute([$treeId]);

        successResponse([
            'id' => 'p' . $personId,
            'db_id' => $personId,
            'given_name' => $givenName,
            'patronymic' => $patronymic,
            'surname' => $surname,
            'surname_at_birth' => $surnameAtBirth,
            'gender' => $gender,
            'birth_day' => $birthDay,
            'birth_month' => $birthMonth,
            'birth' => $birthYear,
            'birth_place' => $birthPlace,
            'data_accuracy' => $dataAccuracy,
            'occupation' => $occupation,
            'residence' => $residence,
            'nationality' => $nationality,
            'biography' => $biography,
            'is_root' => false
        ], 'Person created');

    } catch (Exception $e) {
        error_log('Person creation error: ' . $e->getMessage());
        errorResponse('Failed to create person: ' . $e->getMessage(), 500);
    }
}

// PUT - Update person
if ($method === 'PUT') {
    $auth->requireEditAccess();
    $treeId = $auth->getTreeId();
    $data = getJsonInput();

    $personId = $_GET['id'] ?? $data['id'] ?? null;
    if (!$personId) {
        errorResponse('Person ID is required');
    }

    // Remove 'p' prefix if present
    $personId = preg_replace('/^p/', '', $personId);

    // Verify person belongs to this tree
    $stmt = $db->prepare("SELECT id FROM persons WHERE id = ? AND tree_id = ?");
    $stmt->execute([$personId, $treeId]);
    if (!$stmt->fetch()) {
        errorResponse('Person not found', 404);
    }

    // Build update query
    $updates = [];
    $params = [];

    if (array_key_exists('given_name', $data)) {
        $updates[] = "given_name = ?";
        $params[] = $data['given_name'] !== null ? trim($data['given_name']) : null;
    }

    if (array_key_exists('patronymic', $data)) {
        $updates[] = "patronymic = ?";
        $params[] = $data['patronymic'] !== null ? trim($data['patronymic']) : null;
    }

    if (array_key_exists('surname', $data)) {
        $updates[] = "surname = ?";
        $params[] = $data['surname'] !== null ? trim($data['surname']) : null;
    }

    if (array_key_exists('surname_at_birth', $data)) {
        $updates[] = "surname_at_birth = ?";
        $params[] = $data['surname_at_birth'] !== null ? trim($data['surname_at_birth']) : null;
    }

    if (array_key_exists('gender', $data)) {
        $gender = $data['gender'];
        if ($gender !== null && !in_array($gender, ['male', 'female'])) {
            $gender = null;
        }
        $updates[] = "gender = ?";
        $params[] = $gender;
    }

    if (array_key_exists('birth_day', $data)) {
        $updates[] = "birth_day = ?";
        $params[] = $data['birth_day'] !== '' && $data['birth_day'] !== null ? (int)$data['birth_day'] : null;
    }

    if (array_key_exists('birth_month', $data)) {
        $updates[] = "birth_month = ?";
        $params[] = $data['birth_month'] !== '' && $data['birth_month'] !== null ? (int)$data['birth_month'] : null;
    }

    if (array_key_exists('birth', $data)) {
        $updates[] = "birth_year = ?";
        $params[] = $data['birth'] !== '' && $data['birth'] !== null ? (int)$data['birth'] : null;
    }

    if (array_key_exists('birth_place', $data)) {
        $updates[] = "birth_place = ?";
        $params[] = $data['birth_place'] !== null ? trim($data['birth_place']) : null;
    }

    if (array_key_exists('data_accuracy', $data)) {
        $dataAccuracy = $data['data_accuracy'];
        if (!in_array($dataAccuracy, ['unknown', 'assumed', 'relative', 'confirmed'], true)) {
            $dataAccuracy = 'unknown';
        }
        $updates[] = "data_accuracy = ?";
        $params[] = $dataAccuracy;
    }

    if (array_key_exists('occupation', $data)) {
        $updates[] = "occupation = ?";
        $params[] = $data['occupation'] !== null ? trim($data['occupation']) : null;
    }

    if (array_key_exists('residence', $data)) {
        $updates[] = "residence = ?";
        $params[] = $data['residence'] !== null ? trim($data['residence']) : null;
    }

    if (array_key_exists('nationality', $data)) {
        $updates[] = "nationality = ?";
        $params[] = $data['nationality'] !== null ? trim($data['nationality']) : null;
    }

    if (array_key_exists('biography', $data)) {
        $updates[] = "biography = ?";
        $params[] = $data['biography'];
    }

    if (empty($updates)) {
        errorResponse('No fields to update');
    }

    $params[] = $personId;

    $stmt = $db->prepare("
        UPDATE persons
        SET " . implode(', ', $updates) . "
        WHERE id = ?
    ");
    $stmt->execute($params);

    // Update tree timestamp
    $stmt = $db->prepare("UPDATE trees SET updated_at = NOW() WHERE id = ?");
    $stmt->execute([$treeId]);

    // Return updated person
    $stmt = $db->prepare("
        SELECT id, given_name, patronymic, surname, surname_at_birth,
               gender, birth_day, birth_month, birth_year, birth_place, data_accuracy,
               occupation, residence, nationality,
               biography, is_root
        FROM persons
        WHERE id = ?
    ");
    $stmt->execute([$personId]);
    $p = $stmt->fetch();

    successResponse([
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
    ], 'Person updated');
}

// DELETE - Delete person
if ($method === 'DELETE') {
    $auth->requireEditAccess();
    $treeId = $auth->getTreeId();

    $personId = $_GET['id'] ?? null;
    if (!$personId) {
        errorResponse('Person ID is required');
    }

    // Remove 'p' prefix if present
    $personId = preg_replace('/^p/', '', $personId);

    // Verify person belongs to this tree and is not root
    $stmt = $db->prepare("SELECT id, is_root FROM persons WHERE id = ? AND tree_id = ?");
    $stmt->execute([$personId, $treeId]);
    $person = $stmt->fetch();

    if (!$person) {
        errorResponse('Person not found', 404);
    }

    if ($person['is_root']) {
        errorResponse('Cannot delete root person');
    }

    // Delete person (cascades to marriages and marriage_children)
    $stmt = $db->prepare("DELETE FROM persons WHERE id = ?");
    $stmt->execute([$personId]);

    // Update tree timestamp
    $stmt = $db->prepare("UPDATE trees SET updated_at = NOW() WHERE id = ?");
    $stmt->execute([$treeId]);

    successResponse(null, 'Person deleted');
}

errorResponse('Method not allowed', 405);
