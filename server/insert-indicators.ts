import { pool } from './db';

async function insertIndicators() {
  const sql = `
    INSERT INTO mst_indicator (name, is_active, created_by_id, created_by_user, created_date) VALUES
    ('Investment', 1, 1, 'system', NOW()),
    ('Payout', 1, 1, 'system', NOW()),
    ('withdrawal', 1, 1, 'system', NOW()),
    ('Closure', 1, 1, 'system', NOW())
  `;
  
  await pool.execute(sql);
  console.log('Indicators inserted successfully');
}

insertIndicators().catch(console.error);