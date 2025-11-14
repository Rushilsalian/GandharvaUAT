-- Content Management Tables

CREATE TABLE IF NOT EXISTS content_categories (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active TINYINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  category_id VARCHAR(36),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content TEXT,
  media_type VARCHAR(20) NOT NULL,
  media_url TEXT,
  thumbnail_url TEXT,
  display_order INT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  is_published TINYINT DEFAULT 0,
  published_at TIMESTAMP NULL,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES content_categories(id)
);

CREATE TABLE IF NOT EXISTS offers (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  image_url TEXT,
  link_url TEXT,
  valid_from TIMESTAMP NULL,
  valid_to TIMESTAMP NULL,
  display_order INT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT IGNORE INTO content_categories (name, description) VALUES
('Financial Updates', 'Latest financial news and market updates'),
('Investment Opportunities', 'New investment products and opportunities'),
('Market Analysis', 'Market trends and analysis reports'),
('Company News', 'Company announcements and updates'),
('Educational Content', 'Financial education and tips');