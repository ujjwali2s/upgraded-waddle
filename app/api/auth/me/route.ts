
import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import pool from "@/lib/db"

export async function GET() {
    const session = await getSession()

    if (!session) {
        return NextResponse.json({ user: null })
    }

    // Optionally fetch full user details if needed, but session is enough for isLoggedIn
    return NextResponse.json({
        user: {
            id: session.userId,
            email: session.email,
            role: session.role
        }
    })
}
