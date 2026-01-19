-- Shajara Family Tree Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS shajara CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shajara;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Trees table (one per user)
CREATE TABLE IF NOT EXISTS trees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    share_edit_token VARCHAR(64) UNIQUE,
    share_view_token VARCHAR(64) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Persons table
CREATE TABLE IF NOT EXISTS persons (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tree_id INT NOT NULL,
    gender ENUM('male', 'female') DEFAULT NULL,
    is_root BOOLEAN DEFAULT FALSE,
    given_name VARCHAR(100) DEFAULT NULL,
    patronymic VARCHAR(100) DEFAULT NULL,
    surname VARCHAR(100) DEFAULT NULL,
    surname_at_birth VARCHAR(100) DEFAULT NULL,
    birth_day TINYINT DEFAULT NULL,
    birth_month TINYINT DEFAULT NULL,
    birth_year INT DEFAULT NULL,
    birth_place VARCHAR(255) DEFAULT NULL,
    data_accuracy ENUM('unknown', 'assumed', 'relative', 'confirmed') DEFAULT 'unknown',
    residence VARCHAR(255) DEFAULT NULL,
    occupation VARCHAR(255) DEFAULT NULL,
    nationality VARCHAR(255) DEFAULT NULL,
    biography TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE,
    INDEX idx_tree_id (tree_id)
) ENGINE=InnoDB;

-- Marriages table
CREATE TABLE IF NOT EXISTS marriages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tree_id INT NOT NULL,
    husband_id INT NOT NULL,
    wife_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE,
    FOREIGN KEY (husband_id) REFERENCES persons(id) ON DELETE CASCADE,
    FOREIGN KEY (wife_id) REFERENCES persons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_marriage (husband_id, wife_id),
    INDEX idx_tree_id (tree_id)
) ENGINE=InnoDB;

-- Marriage children (linking table)
CREATE TABLE IF NOT EXISTS marriage_children (
    id INT PRIMARY KEY AUTO_INCREMENT,
    marriage_id INT NOT NULL,
    child_id INT NOT NULL,
    child_order INT DEFAULT 0,
    FOREIGN KEY (marriage_id) REFERENCES marriages(id) ON DELETE CASCADE,
    FOREIGN KEY (child_id) REFERENCES persons(id) ON DELETE CASCADE,
    UNIQUE KEY unique_child_in_marriage (marriage_id, child_id),
    INDEX idx_marriage_id (marriage_id),
    INDEX idx_child_id (child_id)
) ENGINE=InnoDB;

-- Sessions table for auth
CREATE TABLE IF NOT EXISTS sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB;
