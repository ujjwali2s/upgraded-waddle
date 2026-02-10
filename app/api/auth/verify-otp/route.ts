import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
    try {
        const { email, otp } = await request.json()

        if (!email || !otp) {
            return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Get user by email
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

        if (userError || !user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // 2. Check OTP
        if (!user.otp_code || user.otp_code !== otp) {
            return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
        }

        if (new Date(user.otp_expires_at) < new Date()) {
            return NextResponse.json({ error: "OTP has expired" }, { status: 400 })
        }

        // 3. Verify User
        const { error: updateError } = await supabase
            .from('users')
            .update({
                is_verified: true,
                otp_code: null,
                otp_expires_at: null
            })
            .eq('id', user.id)

        if (updateError) {
            console.error("Update error:", updateError)
            return NextResponse.json({ error: "Failed to verify user" }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Verify OTP error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
