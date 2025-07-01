// npm i mysql2
import { createPool } from "mysql2/promise";
import "dotenv/config";



export const pool = createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});


async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Conexión exitosa a la base de datos");
    conn.release(); // ¡Importante!
  } catch (err) {
    console.error("❌ Error de conexión:", err);
  }
}

testConnection();