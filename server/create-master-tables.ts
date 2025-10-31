import { pool } from './db';

async function createMasterTables() {
  const userTable = `
    CREATE TABLE mst_user (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      user_name VARCHAR(100) NOT NULL,
      password VARCHAR(255) NOT NULL,
      mobile VARCHAR(20) NULL,
      mobile_verified DATETIME NULL,
      email VARCHAR(50) NULL,
      email_verified DATETIME NULL,
      role_id INT NOT NULL,
      client_id INT NULL,
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
    )
  `;

  const branchTable = `
    CREATE TABLE mst_branch (
      branch_id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      address VARCHAR(100) NULL,
      city VARCHAR(50) NULL,
      pincode INT NULL,
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
    )
  `;

  const clientTable = `
    CREATE TABLE mst_client (
      client_id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) NOT NULL,
      name VARCHAR(100) NOT NULL,
      mobile VARCHAR(20) NULL,
      email VARCHAR(50) NULL,
      dob DATE NULL,
      pan_no VARCHAR(10) NULL,
      aadhaar_no VARCHAR(15) NULL,
      branch VARCHAR(20) NULL,
      branch_id INT NULL,
      address VARCHAR(200) NULL,
      city VARCHAR(50) NULL,
      pincode INT NULL,
      reference_id INT NULL,
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
    )
  `;
  
  await pool.execute(userTable);
  console.log('mst_user table created');
  
  await pool.execute(branchTable);
  console.log('mst_branch table created');
  
  await pool.execute(clientTable);
  console.log('mst_client table created');
}

createMasterTables().catch(console.error);