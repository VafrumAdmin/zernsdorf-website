import mysql from 'mysql2/promise';

// MySQL connection pool
let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'zernsdorf',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

// Helper for queries
export async function query<T = unknown>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

// Helper for single row
export async function queryOne<T = unknown>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] || null;
}

// Helper for insert (returns insertId)
export async function insert(
  sql: string,
  params?: unknown[]
): Promise<number> {
  const pool = getPool();
  const [result] = await pool.execute(sql, params);
  return (result as mysql.ResultSetHeader).insertId;
}

// Helper for update/delete (returns affectedRows)
export async function execute(
  sql: string,
  params?: unknown[]
): Promise<number> {
  const pool = getPool();
  const [result] = await pool.execute(sql, params);
  return (result as mysql.ResultSetHeader).affectedRows;
}

// Check if MySQL is configured
export function isMySQLConfigured(): boolean {
  return !!(
    process.env.MYSQL_HOST &&
    process.env.MYSQL_USER &&
    process.env.MYSQL_DATABASE
  );
}
