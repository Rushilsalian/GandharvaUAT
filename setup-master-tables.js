const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupMasterTables() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      multipleStatements: true
    });

    console.log('Connected to database');

    // Read and execute master tables SQL
    const masterTablesSQL = fs.readFileSync(path.join(__dirname, 'create_master_tables.sql'), 'utf8');
    await connection.execute(masterTablesSQL);
    console.log('Master tables created successfully');

    // Read and execute role tables SQL
    const roleTablesSQL = fs.readFileSync(path.join(__dirname, 'create_role_tables.sql'), 'utf8');
    await connection.execute(roleTablesSQL);
    console.log('Role tables created successfully');

    // Read and execute transaction tables SQL
    const transactionTablesSQL = fs.readFileSync(path.join(__dirname, 'create_transaction_tables.sql'), 'utf8');
    await connection.execute(transactionTablesSQL);
    console.log('Transaction tables created successfully');

    console.log('All master tables setup completed!');

  } catch (error) {
    console.error('Error setting up master tables:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupMasterTables();