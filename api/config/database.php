<?php
/**
 * Database Configuration
 */

class Database {
    private $host = 'localhost';
    private $db_name = 'shajara';
    private $username = 'root';
    private $password = '';
    private $conn = null;

    public function getConnection() {
        if ($this->conn !== null) {
            return $this->conn;
        }

        try {
            $this->conn = new PDO(
                "mysql:host={$this->host};dbname={$this->db_name};charset=utf8mb4",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Database connection failed']);
            exit;
        }

        return $this->conn;
    }
}
