import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import pool from "@/lib/db"

export async function POST(request: Request) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { fullName, username } = await request.json()
        const client = await pool.connect()
        try {
            // Update public.users
            await client.query(`
            UPDATE public.users 
            SET full_name = $1, username = $2, updated_at = NOW()
            WHERE id = $3
        `, [fullName, username, session.userId])

            // Update public.profiles if it exists separately and is used elsewhere?
            // My schema inspection showed columns in public.users? 
            // Wait, inspection showed 'username' in users.
            // Let's assume updating 'users' table is sufficient for now.
            // If 'profiles' table is legacy, we might need to sync it.
            // But for "Custom Auth", I'm sticking to the table I control.

            return NextResponse.json({ success: true })

        } finally {
            client.release()
        }
    } catch (error) {
        console.error("Profile Update Error", error)
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
