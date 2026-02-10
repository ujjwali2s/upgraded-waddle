import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendData } from "@/lib/email"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
    try {
        const { email, password, fullName } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single()

        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 })
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // 3. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        // 4. Insert into users table
        const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
                email,
                password_hash: hashedPassword,
                full_name: fullName,
                otp_code: otp,
                otp_expires_at: expiresAt.toISOString(),
                is_verified: false
            })
            .select('id')
            .single()

        if (insertError || !newUser) {
            console.error("Insert error:", insertError)
            return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
        }

        const userId = newUser.id

        // 5. Send Custom OTP Email
        const html = `
        <h1>Verify Your Email</h1>
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code expires in 10 minutes.</p>
      `
        await sendData(email, "Verify your ShipsPro Account", html)

        return NextResponse.json({ success: true, userId })

    } catch (error) {
        console.error("Custom Signup Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
