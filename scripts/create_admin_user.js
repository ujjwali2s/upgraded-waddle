const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.error('Usage: node scripts/create_admin_user.js <email> <password>');
        process.exit(1);
    }

    try {
        const client = await pool.connect();
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const res = await client.query(
                `INSERT INTO public.admins (email, password_hash)
         VALUES ($1, $2)
         ON CONFLICT (email) DO UPDATE SET password_hash = $2
         RETURNING id, email`,
                [email, hashedPassword]
            );

            console.log('Admin user created/updated successfully:');
            console.log(res.rows[0]);

        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error creating admin user:', err);
    } finally {
        await pool.end();
    }
}

main();
