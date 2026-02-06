const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error("Please provide a SQL file path");
        process.exit(1);
    }

    const client = await pool.connect();
    try {
        const sql = fs.readFileSync(path.resolve(process.cwd(), filePath), 'utf8');
        await client.query(sql);
        console.log('Migration successfully executed:', filePath);
    } catch (err) {
        console.error('Migration failed', err);
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
}

run();
