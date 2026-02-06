import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import pool from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { currentPassword, newPassword } = await request.json()

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 })
        }

        const client = await pool.connect()
        try {
            // 1. Fetch user password hash
            const { rows } = await client.query('SELECT password_hash FROM public.users WHERE id = $1', [session.userId])
            if (rows.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 })

            const user = rows[0]

            // 2. Verify current password
            const isMatch = await bcrypt.compare(currentPassword, user.password_hash)
            if (!isMatch) {
                return NextResponse.json({ error: "Incorrect current password" }, { status: 400 })
            }

            // 3. Hash new password
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(newPassword, salt)

            // 4. Update DB
            await client.query('UPDATE public.users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, session.userId])

            return NextResponse.json({ success: true })

        } finally {
            client.release()
        }
    } catch (error) {
        console.error("Password Change Error", error)
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
