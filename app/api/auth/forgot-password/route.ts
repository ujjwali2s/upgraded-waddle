import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { sendPasswordResetOTP } from "@/lib/email"

export async function POST(request: Request) {
    const client = await pool.connect()
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        // 1. Check if user exists
        const { rows: userRows } = await client.query(
            "SELECT id, full_name FROM public.users WHERE email ILIKE $1",
            [email]
        )
        const user = userRows[0]

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // 2. Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        // 3. Update User
        await client.query(
            "UPDATE public.users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3",
            [otp, expiresAt.toISOString(), user.id]
        )

        // 4. Send Email
        await sendPasswordResetOTP(email, otp)

        return NextResponse.json({ success: true, message: "OTP sent to your email" })

    } catch (error) {
        console.error("Forgot Password Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    } finally {
        client.release()
    }
}
