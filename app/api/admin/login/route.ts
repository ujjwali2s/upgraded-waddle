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

        // Fetch admin data
        const { data: admin, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('email', email)
            .single()

        if (adminError || !admin) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
        }

        // Check password
        const isMatch = await bcrypt.compare(password, admin.password_hash)
        if (!isMatch) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
        }

        // Create Session with 'admin' role
        // We use the same session mechanism, just with the role 'admin'
        await createSession(admin.id, admin.email, "admin")

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Admin Login Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
