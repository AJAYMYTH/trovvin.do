-- Database setup for trovvin.do
-- MySQL Database Schema

CREATE DATABASE IF NOT EXISTS trovvin_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE trovvin_db;

-- Issue Reports Table
CREATE TABLE IF NOT EXISTS issue_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    issue_type VARCHAR(50) NOT NULL,
    issue_title VARCHAR(255) NOT NULL,
    video_url VARCHAR(500),
    browser VARCHAR(50) NOT NULL,
    device VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    steps_to_reproduce TEXT,
    email VARCHAR(255),
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_severity (severity),
    INDEX idx_created_at (created_at),
    INDEX idx_issue_type (issue_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    status VARCHAR(20) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Download Analytics Table (optional, for tracking download patterns)
CREATE TABLE IF NOT EXISTS download_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    video_id VARCHAR(20),
    quality VARCHAR(20),
    format VARCHAR(10),
    media_type VARCHAR(10),
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    download_duration INT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at),
    INDEX idx_video_id (video_id),
    INDEX idx_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user for the application (adjust password as needed)
-- CREATE USER IF NOT EXISTS 'trovvin_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';
-- GRANT SELECT, INSERT, UPDATE ON trovvin_db.* TO 'trovvin_user'@'localhost';
-- FLUSH PRIVILEGES;
