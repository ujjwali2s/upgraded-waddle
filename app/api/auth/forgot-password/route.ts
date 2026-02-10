import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendPasswordResetOTP } from "@/lib/email"

export async function POST(request: Request) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 })
        }

        const supabase = createAdminClient()

        // 1. Check if user exists
        console.log(`Searching for user with email: '${email}'`)
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('id, full_name')
            .ilike('email', email)
            .single()

        if (fetchError) {
            console.error("User lookup error:", fetchError)
        }

        if (!user) {
            console.log("User not found in 'users' table.")
            // Security: Don't reveal if user exists
            // But for detailed UX we might want to, let's Stick to standard practice which is usually ambiguous or explicit depending on requirement.
            // User asked for "give a forget password option to user", usually implies friendly UX.
            // For now, let's return success even if user doesn't exist to prevent enumeration, unless debugging.
            // Actually, let's return specific error for better UX as this is an internal tool/app from context.
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // 2. Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        // 3. Update User
        const { error: updateError } = await supabase
            .from('users')
            .update({
                otp_code: otp,
                otp_expires_at: expiresAt.toISOString()
            })
            .eq('id', user.id)

        if (updateError) {
            console.error("OTP Update Error:", updateError)
            return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 })
        }

        // 4. Send Email
        await sendPasswordResetOTP(email, otp)

        return NextResponse.json({ success: true, message: "OTP sent to your email" })

    } catch (error) {
        console.error("Forgot Password Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
