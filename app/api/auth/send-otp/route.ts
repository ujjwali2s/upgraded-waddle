import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendData } from "@/lib/email"

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const authHeader = request.headers.get('Authorization')
        let token = undefined

        console.log("Send-OTP Debug: Auth Header present?", !!authHeader)

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1]
        }

        // Try getting user with token if provided, otherwise default (cookies)
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(token)

        console.log("Send-OTP Debug: User user found?", !!user, user?.id)

        if (authError) {
            console.error("Send-OTP Debug: Auth error", authError)
        }

        if (!user || !user.email) {
            console.error("Send-OTP Debug: No user or email found. Returning 401.")
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        // Update profile
        const { error: updateError } = await supabase
            .from("users")
            .update({
                otp_code: otp,
                otp_expires_at: expiresAt.toISOString(),
            })
            .eq("id", user.id)

        if (updateError) {
            console.error("Error updating OTP:", updateError)
            return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 })
        }

        // Send Email
        const html = `
      <h1>Verify Your Email</h1>
      <p>Your verification code is: <strong>${otp}</strong></p>
      <p>This code expires in 10 minutes.</p>
    `
        await sendData(user.email, "Verify your ShipsPro Account", html)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Send OTP error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
