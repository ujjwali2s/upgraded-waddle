const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    const email = process.argv[2];

    if (!email) {
        console.error('Please provide an email address.');
        console.log('Usage: node scripts/make_admin.js <email>');
        process.exit(1);
    }

    try {
        const client = await pool.connect();
        try {
            const res = await client.query(
                "UPDATE public.users SET role = 'admin' WHERE email = $1 RETURNING *",
                [email]
            );

            if (res.rowCount === 0) {
                console.error(`User with email ${email} not found.`);
            } else {
                console.log(`Successfully promoted ${email} to admin.`);
                console.log('User details:', res.rows[0]);
            }
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error executing query', err.stack);
    } finally {
        await pool.end();
    }
}

main();
