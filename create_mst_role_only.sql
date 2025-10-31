CREATE TABLE mst_role (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_active BIT(1) NOT NULL,
    created_by_id INT NOT NULL,
    created_by_user VARCHAR(50) NOT NULL,
    created_date DATETIME NOT NULL,
    modified_by_id INT NULL,
    modified_by_user VARCHAR(50) NULL,
    modified_date DATETIME NULL,
    deleted_by_id INT NULL,
    deleted_by_user VARCHAR(50) NULL,
    deleted_date DATETIME NULL
);