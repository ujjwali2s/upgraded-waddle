import { NextResponse } from "next/server"
import pool from "@/lib/db"
import bcrypt from "bcryptjs"
import { createSession } from "@/lib/session"

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
        }

        const client = await pool.connect()
        try {
            const result = await client.query('SELECT * FROM public.users WHERE email = $1', [email])
            if (result.rowCount === 0) {
                return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
            }
            const user = result.rows[0]

            // Check password
            const isMatch = await bcrypt.compare(password, user.password_hash)
            if (!isMatch) {
                return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
            }

            // Check verification
            if (!user.is_verified) {
                // User requested "show user not exist", so we return invalid credentials.
                return NextResponse.json({ error: "Invalid credentials" }, { status: 400 })
            }

            // Create Session
            await createSession(user.id, user.email, user.role || 'user')

            return NextResponse.json({ success: true })
        } finally {
            client.release()
        }
    } catch (error) {
        console.error("Login Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
