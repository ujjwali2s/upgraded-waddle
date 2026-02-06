import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { sendData } from "@/lib/email"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
    try {
        const { email, password, fullName } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
        }

        const client = await pool.connect()
        try {
            // 1. Check if user exists
            const checkUser = await client.query('SELECT id FROM public.users WHERE email = $1', [email])
            if ((checkUser.rowCount ?? 0) > 0) {
                return NextResponse.json({ error: "User already exists" }, { status: 400 })
            }

            // 2. Hash Password
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)

            // 3. Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString()
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

            // 4. Insert into public.users
            const insertUser = await client.query(`
        INSERT INTO public.users (
          email,
          password_hash,
          full_name,
          otp_code,
          otp_expires_at,
          is_verified
        ) VALUES ($1, $2, $3, $4, $5, FALSE)
        RETURNING id
      `, [email, hashedPassword, fullName, otp, expiresAt.toISOString()])

            const userId = insertUser.rows[0].id

            // 5. Send Custom OTP Email
            const html = `
        <h1>Verify Your Email</h1>
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code expires in 10 minutes.</p>
      `
            await sendData(email, "Verify your ShipsPro Account", html)

            return NextResponse.json({ success: true, userId })

        } finally {
            client.release()
        }

    } catch (error) {
        console.error("Custom Signup Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
