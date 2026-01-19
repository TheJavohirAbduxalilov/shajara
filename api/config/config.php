<?php
/**
 * Application Configuration
 */

// Error reporting (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Timezone
date_default_timezone_set('Asia/Tashkent');

// Session settings
define('SESSION_LIFETIME', 60 * 60 * 24 * 30); // 30 days

// CORS headers for API
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Send JSON response
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send error response
 */
function errorResponse($message, $statusCode = 400) {
    jsonResponse(['success' => false, 'error' => $message], $statusCode);
}

/**
 * Send success response
 */
function successResponse($data = null, $message = null) {
    $response = ['success' => true];
    if ($message !== null) {
        $response['message'] = $message;
    }
    if ($data !== null) {
        $response['data'] = $data;
    }
    jsonResponse($response);
}

/**
 * Get JSON input
 */
function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}

/**
 * Generate random token
 */
function generateToken($length = 64) {
    return bin2hex(random_bytes($length / 2));
}

/**
 * Validate required fields
 */
function validateRequired($data, $fields) {
    foreach ($fields as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            return $field;
        }
    }
    return null;
}
