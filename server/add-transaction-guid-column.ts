import { pool } from './db';

async function addTransactionGuidColumn() {
  try {
    // Check if column already exists
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'transaction' 
      AND COLUMN_NAME = 'guiid'
    `) as any;

    if (columns.length === 0) {
      // Add the guiid column
      await pool.execute(`
        ALTER TABLE transaction 
        ADD COLUMN guiid VARCHAR(200) NULL 
        AFTER remark
      `);
      console.log('Successfully added guiid column to transaction table');
    } else {
      console.log('guiid column already exists in transaction table');
    }
  } catch (error) {
    console.error('Error adding guiid column:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addTransactionGuidColumn()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { addTransactionGuidColumn };