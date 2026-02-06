import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function POST(request: Request) {
    try {
        const { email, otp } = await request.json()

        if (!email || !otp) {
            return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 })
        }

        const client = await pool.connect()
        try {
            // 1. Get user by email
            const result = await client.query('SELECT * FROM public.users WHERE email = $1', [email])
            if (result.rowCount === 0) {
                return NextResponse.json({ error: "User not found" }, { status: 404 })
            }
            const user = result.rows[0]

            // 2. Check OTP
            if (!user.otp_code || user.otp_code !== otp) {
                return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
            }

            if (new Date(user.otp_expires_at) < new Date()) {
                return NextResponse.json({ error: "OTP has expired" }, { status: 400 })
            }

            // 3. Verify User
            await client.query(`
                UPDATE public.users 
                SET is_verified = TRUE, otp_code = NULL, otp_expires_at = NULL 
                WHERE id = $1
            `, [user.id])

            return NextResponse.json({ success: true })
        } finally {
            client.release()
        }
    } catch (error) {
        console.error("Verify OTP error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
