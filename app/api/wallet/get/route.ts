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
        const { rows } = await client.query('SELECT balance FROM public.users WHERE id = $1', [session.userId])
        if (rows.length === 0) {
            return NextResponse.json({ balance: 0 })
        }
        return NextResponse.json({ balance: Number(rows[0].balance) })
    } catch (error: any) {
        console.error("Wallet Fetch Error:", error)
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 })
    } finally {
        if (client) client.release()
    }
}
