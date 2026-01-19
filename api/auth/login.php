<?php
/**
 * User Login API
 * POST /api/auth/login.php
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

$data = getJsonInput();

// Validate required fields
$missing = validateRequired($data, ['login', 'password']);
if ($missing) {
    errorResponse("Field '$missing' is required");
}

$login = trim($data['login']); // Can be username or email
$password = $data['password'];

$database = new Database();
$db = $database->getConnection();

try {
    // Find user by username or email
    $stmt = $db->prepare("
        SELECT u.*, t.id as tree_id
        FROM users u
        LEFT JOIN trees t ON t.user_id = u.id
        WHERE u.username = ? OR u.email = ?
    ");
    $stmt->execute([$login, strtolower($login)]);
    $user = $stmt->fetch();

    if (!$user) {
        errorResponse('Invalid credentials', 401);
    }

    // Verify password
    if (!password_verify($password, $user['password_hash'])) {
        errorResponse('Invalid credentials', 401);
    }

    // Create session
    $auth = new Auth();
    $token = $auth->createSession($user['id']);

    successResponse([
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'tree_id' => $user['tree_id']
        ]
    ], 'Login successful');

} catch (Exception $e) {
    error_log('Login error: ' . $e->getMessage());
    errorResponse('Login failed: ' . $e->getMessage(), 500);
}
