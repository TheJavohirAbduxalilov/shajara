<?php
/**
 * Authentication Middleware
 */

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/database.php';

class Auth {
    private $db;
    private $user = null;
    private $accessLevel = null; // 'owner', 'editor', 'viewer'
    private $treeId = null;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    /**
     * Check if user is authenticated via session token
     */
    public function check() {
        $token = $this->getTokenFromHeader();

        if (!$token) {
            return false;
        }

        // Clean expired sessions
        $this->cleanExpiredSessions();

        // Find valid session
        $stmt = $this->db->prepare("
            SELECT u.*, s.token, t.id as tree_id
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN trees t ON t.user_id = u.id
            WHERE s.token = ? AND s.expires_at > NOW()
        ");
        $stmt->execute([$token]);
        $result = $stmt->fetch();

        if ($result) {
            $this->user = $result;
            $this->treeId = $result['tree_id'];
            $this->accessLevel = 'owner';
            return true;
        }

        return false;
    }

    /**
     * Check access via share token
     */
    public function checkShareAccess($shareToken) {
        if (!$shareToken) {
            return false;
        }

        // Check edit token
        $stmt = $this->db->prepare("
            SELECT id, user_id, 'editor' as access_level
            FROM trees
            WHERE share_edit_token = ?
        ");
        $stmt->execute([$shareToken]);
        $result = $stmt->fetch();

        if ($result) {
            $this->treeId = $result['id'];
            $this->accessLevel = 'editor';
            return true;
        }

        // Check view token
        $stmt = $this->db->prepare("
            SELECT id, user_id, 'viewer' as access_level
            FROM trees
            WHERE share_view_token = ?
        ");
        $stmt->execute([$shareToken]);
        $result = $stmt->fetch();

        if ($result) {
            $this->treeId = $result['id'];
            $this->accessLevel = 'viewer';
            return true;
        }

        return false;
    }

    /**
     * Require authentication or valid share token
     */
    public function requireAuth() {
        // First check session auth
        if ($this->check()) {
            return;
        }

        // Then check share token
        $shareToken = $_GET['share'] ?? $_SERVER['HTTP_X_SHARE_TOKEN'] ?? null;
        if ($shareToken && $this->checkShareAccess($shareToken)) {
            return;
        }

        errorResponse('Unauthorized', 401);
    }

    /**
     * Require edit access (owner or editor)
     */
    public function requireEditAccess() {
        $this->requireAuth();

        if ($this->accessLevel === 'viewer') {
            errorResponse('View only access', 403);
        }
    }

    /**
     * Require owner access
     */
    public function requireOwner() {
        $this->requireAuth();

        if ($this->accessLevel !== 'owner') {
            errorResponse('Owner access required', 403);
        }
    }

    /**
     * Get current user
     */
    public function getUser() {
        return $this->user;
    }

    /**
     * Get current tree ID
     */
    public function getTreeId() {
        return $this->treeId;
    }

    /**
     * Get access level
     */
    public function getAccessLevel() {
        return $this->accessLevel;
    }

    /**
     * Create session for user
     */
    public function createSession($userId) {
        $token = generateToken();
        $expiresAt = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);

        $stmt = $this->db->prepare("
            INSERT INTO sessions (user_id, token, expires_at)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$userId, $token, $expiresAt]);

        return $token;
    }

    /**
     * Destroy session
     */
    public function destroySession() {
        $token = $this->getTokenFromHeader();

        if ($token) {
            $stmt = $this->db->prepare("DELETE FROM sessions WHERE token = ?");
            $stmt->execute([$token]);
        }
    }

    /**
     * Get token from Authorization header
     */
    private function getTokenFromHeader() {
        $authHeader = '';

        // Try getallheaders() if available (Apache)
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }

        // Fallback for CGI/FastCGI (InfinityFree, etc.)
        if (empty($authHeader)) {
            if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
                $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
            } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
                $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
            }
        }

        if (preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Clean expired sessions
     */
    private function cleanExpiredSessions() {
        $stmt = $this->db->prepare("DELETE FROM sessions WHERE expires_at < NOW()");
        $stmt->execute();
    }
}
