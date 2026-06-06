-- Abhyaas The Global School — Database Schema
-- Run once via phpMyAdmin (select abhyaas_db first)

CREATE TABLE IF NOT EXISTS admins (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  username   VARCHAR(100) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  name       VARCHAR(200) NOT NULL,
  role       ENUM('super','admin') DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) PRIMARY KEY,
  expires    INT(11) UNSIGNED NOT NULL,
  data       MEDIUMTEXT
);

-- Blog posts (news / articles / achievements)
CREATE TABLE IF NOT EXISTS posts (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(500) NOT NULL,
  slug         VARCHAR(500) NOT NULL UNIQUE,
  excerpt      TEXT,
  content      LONGTEXT,
  cover_image  VARCHAR(300) DEFAULT NULL,
  category     ENUM('news','article','achievement') DEFAULT 'news',
  status       ENUM('draft','published','deleted') DEFAULT 'draft',
  featured     TINYINT(1) DEFAULT 0,
  views        INT DEFAULT 0,
  published_at DATETIME DEFAULT NULL,
  created_by   INT DEFAULT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(500) NOT NULL,
  description TEXT,
  event_date  DATE DEFAULT NULL,
  event_time  VARCHAR(50) DEFAULT NULL,
  location    VARCHAR(300) DEFAULT NULL,
  cover_image VARCHAR(300) DEFAULT NULL,
  status      ENUM('upcoming','ongoing','completed') DEFAULT 'upcoming',
  created_by  INT DEFAULT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL
);

-- Gallery albums
CREATE TABLE IF NOT EXISTS gallery_albums (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(300) NOT NULL,
  slug        VARCHAR(300) NOT NULL UNIQUE,
  description TEXT DEFAULT NULL,
  cover_image VARCHAR(300) DEFAULT NULL,
  is_active   TINYINT(1) DEFAULT 1,
  created_by  INT DEFAULT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL
);

-- Gallery photos
CREATE TABLE IF NOT EXISTS gallery_photos (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  album_id   INT NOT NULL,
  filename   VARCHAR(300) NOT NULL,
  caption    VARCHAR(500) DEFAULT NULL,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (album_id) REFERENCES gallery_albums(id) ON DELETE CASCADE
);

-- Faculty
CREATE TABLE IF NOT EXISTS faculty (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(300) NOT NULL,
  designation   VARCHAR(300) NOT NULL,
  subject       VARCHAR(200) DEFAULT NULL,
  qualification VARCHAR(300) DEFAULT NULL,
  experience    VARCHAR(100) DEFAULT NULL,
  photo         VARCHAR(300) DEFAULT NULL,
  sort_order    INT DEFAULT 0,
  is_active     TINYINT(1) DEFAULT 1,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admission enquiries
CREATE TABLE IF NOT EXISTS admission_enquiries (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  parent_name   VARCHAR(300) NOT NULL,
  phone         VARCHAR(20) NOT NULL,
  email         VARCHAR(200) DEFAULT NULL,
  student_name  VARCHAR(300) DEFAULT NULL,
  class_seeking VARCHAR(50) DEFAULT NULL,
  message       TEXT DEFAULT NULL,
  status        ENUM('new','contacted','enrolled','closed') DEFAULT 'new',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Contact submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(300) NOT NULL,
  phone      VARCHAR(20) NOT NULL,
  email      VARCHAR(200) DEFAULT NULL,
  subject    VARCHAR(500) DEFAULT NULL,
  message    TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CBSE Compliance documents
CREATE TABLE IF NOT EXISTS compliance_documents (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  doc_type    VARCHAR(100) NOT NULL,
  label       VARCHAR(500) NOT NULL,
  filename    VARCHAR(300) NOT NULL,
  year        VARCHAR(10) DEFAULT NULL,
  sort_order  INT DEFAULT 0,
  is_active   TINYINT(1) DEFAULT 1,
  uploaded_by INT DEFAULT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES admins(id) ON DELETE SET NULL
);

-- Downloads
CREATE TABLE IF NOT EXISTS downloads (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  label       VARCHAR(500) NOT NULL,
  filename    VARCHAR(300) NOT NULL,
  category    ENUM('academic','admission','circular','form','calendar','result','other') DEFAULT 'other',
  is_active   TINYINT(1) DEFAULT 1,
  uploaded_by INT DEFAULT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES admins(id) ON DELETE SET NULL
);

-- Newsletter subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(200) NOT NULL UNIQUE,
  name       VARCHAR(200) DEFAULT NULL,
  token      VARCHAR(64)  NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Settings (key-value)
CREATE TABLE IF NOT EXISTS settings (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  value       TEXT,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default admin (password: abhyaas@admin — CHANGE ON FIRST LOGIN)
INSERT IGNORE INTO admins (username, password, name, role)
VALUES ('admin', '$2b$10$FYmK8Q/xQ3jxokXbxQEJ9Oz2metBrfknl8ja46D8cRjiCFhDyH4D6', 'Super Admin', 'super');

-- Default settings
INSERT IGNORE INTO settings (setting_key, value) VALUES
  ('admissions_open', '1'),
  ('admission_year',  '2025-26'),
  ('phone',           ''),
  ('whatsapp',        '');
