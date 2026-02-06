const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND table_schema = 'public';
    `);
        console.log('Columns in public.orders:', res.rows);
    } catch (err) {
        console.error('Error inspecting schema', err);
    } finally {
        client.release();
        pool.end();
    }
}

run();
