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
            const result = await client.query('SELECT * FROM public.admins WHERE email = $1', [email])
            if (result.rowCount === 0) {
                return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
            }
            const admin = result.rows[0]

            // Check password
            const isMatch = await bcrypt.compare(password, admin.password_hash)
            if (!isMatch) {
                return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
            }

            // Create Session with 'admin' role
            // We use the same session mechanism, just with the role 'admin'
            await createSession(admin.id, admin.email, "admin")

            return NextResponse.json({ success: true })
        } finally {
            client.release()
        }
    } catch (error) {
        console.error("Admin Login Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
