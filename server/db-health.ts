import { pool } from './db';

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

export async function warmupConnections(): Promise<void> {
  try {
    const connections = [];
    for (let i = 0; i < 5; i++) {
      connections.push(pool.getConnection());
    }
    const conns = await Promise.all(connections);
    conns.forEach(conn => conn.release());
    console.log('Database connections warmed up');
  } catch (error) {
    console.error('Connection warmup failed:', error);
  }
}