<?php
/**
 * User Registration API
 * POST /api/auth/register.php
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

$data = getJsonInput();

// Validate required fields
$missing = validateRequired($data, ['username', 'email', 'password']);
if ($missing) {
    errorResponse("Field '$missing' is required");
}

$username = trim($data['username']);
$email = trim(strtolower($data['email']));
$password = $data['password'];

// Validate username
if (strlen($username) < 3 || strlen($username) > 50) {
    errorResponse('Username must be 3-50 characters');
}
if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
    errorResponse('Username can only contain letters, numbers and underscores');
}

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    errorResponse('Invalid email format');
}

// Validate password
if (strlen($password) < 6) {
    errorResponse('Password must be at least 6 characters');
}

$database = new Database();
$db = $database->getConnection();

try {
    $db->beginTransaction();

    // Check if username or email already exists
    $stmt = $db->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);

    if ($stmt->fetch()) {
        errorResponse('Username or email already exists');
    }

    // Create user
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $db->prepare("
        INSERT INTO users (username, email, password_hash)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$username, $email, $passwordHash]);
    $userId = $db->lastInsertId();

    // Create tree for user
    $shareEditToken = generateToken();
    $shareViewToken = generateToken();
    $stmt = $db->prepare("
        INSERT INTO trees (user_id, share_edit_token, share_view_token)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$userId, $shareEditToken, $shareViewToken]);
    $treeId = $db->lastInsertId();

    // Create root person "Я" (Me)
    $stmt = $db->prepare("
        INSERT INTO persons (tree_id, given_name, is_root)
        VALUES (?, 'Я', TRUE)
    ");
    $stmt->execute([$treeId]);

    $db->commit();

    // Create session
    $auth = new Auth();
    $token = $auth->createSession($userId);

    successResponse([
        'token' => $token,
        'user' => [
            'id' => $userId,
            'username' => $username,
            'email' => $email
        ]
    ], 'Registration successful');

} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Registration error: ' . $e->getMessage());
    errorResponse('Registration failed: ' . $e->getMessage(), 500);
} catch (Exception $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log('Registration error: ' . $e->getMessage());
    errorResponse('Registration failed: ' . $e->getMessage(), 500);
}
