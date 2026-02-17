import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import pool from "@/lib/db"

export async function GET(request: Request) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await pool.connect()
    try {
        const { rows } = await client.query(`
      SELECT email, full_name, username 
      FROM public.users
      WHERE id = $1
    `, [session.userId])

        if (rows.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }


        const user = rows[0]
        return NextResponse.json({
            email: user.email,
            full_name: user.full_name || "",
            username: user.username || ""
        })
    } catch (error) {
        console.error("Profile Fetch Error", error)
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    } finally {
        client.release()
    }
}
