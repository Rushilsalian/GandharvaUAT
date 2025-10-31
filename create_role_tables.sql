CREATE TABLE mst_module (
    module_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_module_id INT NULL,
    table_name VARCHAR(50) NULL,
    icon VARCHAR(50) NULL,
    seq_no INT NULL,
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

CREATE TABLE mst_role_right (
    role_right_id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    module_id INT NOT NULL,
    access_read INT NOT NULL,
    access_write INT NOT NULL,
    access_update INT NOT NULL,
    access_delete INT NOT NULL,
    access_export INT NOT NULL
);