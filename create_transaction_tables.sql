CREATE TABLE client_withdrawal_request (
    client_withdrawal_request_id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    withdrawal_date DATE NOT NULL,
    withdrawal_amount DECIMAL(18,2) NOT NULL,
    withdrawal_remark VARCHAR(500) NULL,
    created_by_id INT NOT NULL,
    created_by_user VARCHAR(50) NOT NULL,
    created_date DATETIME NOT NULL
);

CREATE TABLE client_investment_request (
    client_investment_request_id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    investment_date DATE NOT NULL,
    investment_amount DECIMAL(18,2) NOT NULL,
    investment_remark VARCHAR(100) NULL,
    transaction_id VARCHAR(100) NOT NULL,
    transaction_no VARCHAR(100) NOT NULL,
    created_by_id INT NOT NULL,
    created_by_user VARCHAR(50) NOT NULL,
    created_date DATETIME NOT NULL
);

CREATE TABLE client_referral_request (
    client_referral_request_id INT AUTO_INCREMENT PRIMARY KEY,
    client_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    created_by_id INT NOT NULL,
    created_by_user VARCHAR(50) NOT NULL,
    created_date DATETIME NOT NULL
);

CREATE TABLE mst_indicator (
    indicator_id INT AUTO_INCREMENT PRIMARY KEY,
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

CREATE TABLE transaction (
    transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_date DATE NOT NULL,
    client_id INT NOT NULL,
    indicator_id INT NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    remark VARCHAR(50) NULL,
    guiid VARCHAR(200) NULL,
    created_by_id INT NOT NULL,
    created_by_user VARCHAR(50) NOT NULL,
    created_date DATETIME NOT NULL
);