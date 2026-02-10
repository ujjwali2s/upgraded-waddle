import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"
import { createSession } from "@/lib/session"

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
        }

        const supabase = await createClient()

        // Fetch user data
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single()

        if (userError || !user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
        }

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
    } catch (error) {
        console.error("Login Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
