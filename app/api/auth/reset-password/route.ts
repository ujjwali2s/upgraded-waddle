import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
    try {
        const { email, otp, newPassword } = await request.json()

        if (!email || !otp || !newPassword) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Fetch user with OTP
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // 2. Verify OTP
        if (user.otp_code !== otp) {
            return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
        }

        const now = new Date()
        const expiresAt = new Date(user.otp_expires_at)

        if (now > expiresAt) {
            return NextResponse.json({ error: "OTP has expired" }, { status: 400 })
        }

        // 3. Hash New Password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(newPassword, salt)

        // 4. Update Password and Clear OTP
        const { error: updateError } = await supabase
            .from('users')
            .update({
                password_hash: hashedPassword,
                otp_code: null,
                otp_expires_at: null
            })
            .eq('id', user.id)

        if (updateError) {
            console.error("Password Update Error:", updateError)
            return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
        }

        return NextResponse.json({ success: true, message: "Password reset successfully" })

    } catch (error) {
        console.error("Reset Password Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
