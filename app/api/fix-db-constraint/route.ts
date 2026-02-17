import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET() {
    const client = await pool.connect()
    try {
        // 1. Drop the existing constraint
        await client.query(`
            ALTER TABLE public.orders 
            DROP CONSTRAINT IF EXISTS orders_payment_method_check
        `)

        // 2. Add the updated constraint including 'plisio'
        await client.query(`
            ALTER TABLE public.orders 
            ADD CONSTRAINT orders_payment_method_check 
            CHECK (payment_method IN ('wallet', 'plisio', 'stripe', 'paypal'))
        `)

        return NextResponse.json({ success: true, message: "Constraint updated successfully" })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    } finally {
        client.release()
    }
}
