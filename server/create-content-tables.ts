import { db } from "./db";
import fs from "fs";
import path from "path";

export async function createContentTables() {
  try {
    console.log('Creating content management tables...');
    
    const sqlPath = path.join(process.cwd(), 'create-content-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.execute(statement);
      }
    }
    
    console.log('Content management tables created successfully');
  } catch (error) {
    console.error('Error creating content tables:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createContentTables()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}