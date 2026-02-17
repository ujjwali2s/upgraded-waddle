
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgresql://postgres.wrwixvdixrcbzukxgqaz:TvzpnxGKRl03TemQ@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=disable",
    ssl: false
});

async function checkRLS() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT tablename, rowsecurity 
            FROM pg_tables 
            WHERE schemaname = 'public' AND tablename = 'users';
        `);
        console.log("Users Table RLS:", res.rows[0]);

        const policies = await client.query(`
            SELECT * FROM pg_policies WHERE tablename = 'users';
        `);
        console.log("Users Policies:", policies.rows);
    } finally {
        client.release();
        await pool.end();
    }
}

checkRLS().catch(console.error);
