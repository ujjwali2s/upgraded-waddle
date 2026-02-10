
import { Pool } from 'pg'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false // Disable SSL for Transaction Pooler if port 6543 and ?sslmode=disable
})

export default pool
