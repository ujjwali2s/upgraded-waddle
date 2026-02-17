import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import pool from "@/lib/db"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
    const results: any = {
        timestamp: new Date().toISOString(),
        env: {
            DATABASE_URL: !!process.env.DATABASE_URL,
            NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            SESSION_SECRET: !!process.env.SESSION_SECRET,
            PLISIO_SECRET_KEY: !!process.env.PLISIO_SECRET_KEY,
        },
        database: { status: "unchecked" },
        supabase: { status: "unchecked" },
        session: { status: "unchecked" }
    }

    // 1. Check Database
    try {
        const client = await pool.connect()
        const { rows } = await client.query('SELECT current_database(), current_schema()')
        results.database = { status: "connected", info: rows[0] }
        client.release()
    } catch (error: any) {
        results.database = { status: "error", message: error.message }
    }

    // 2. Check Supabase
    try {
        const supabase = await createClient()
        const { data, error } = await supabase.from('users').select('id').limit(1)
        if (error) throw error
        results.supabase = { status: "connected", test_query: "success" }
    } catch (error: any) {
        results.supabase = { status: "error", message: error.message }
    }

    // 3. Check Session & User
    try {
        const session = await getSession()
        if (session) {
            results.session = {
                status: "active",
                userId: session.userId,
                email: session.email,
                role: session.role
            }

            const client = await pool.connect()
            const { rows } = await client.query('SELECT id FROM public.users WHERE id = $1', [session.userId])
            results.session.user_exists_in_db = rows.length > 0
            client.release()
        } else {
            results.session = { status: "no_session" }
        }
    } catch (error: any) {
        results.session = { status: "error", message: error.message }
    }

    return NextResponse.json(results)
}
