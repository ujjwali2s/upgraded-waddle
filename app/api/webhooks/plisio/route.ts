
import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function POST(request: Request) {
    try {
        const text = await request.text()

        // Parse body (Plisio sends form-urlencoded usually, but possibly JSON)
        let data: any = {};
        const contentType = request.headers.get("content-type") || ""

        if (contentType.includes("application/json")) {
            try {
                data = JSON.parse(text)
            } catch {
                // fallback
            }
        }

        if (Object.keys(data).length === 0) {
            const params = new URLSearchParams(text)
            data = Object.fromEntries(params.entries())
        }

        const { status, txn_id, source_amount } = data
        const url = new URL(request.url)
        const type = url.searchParams.get("type")
        const id = url.searchParams.get("id") // orderId
        const userId = url.searchParams.get("userId") // for wallet

        // Only process completed payments
        if (status !== "completed") {
            return NextResponse.json({ status: "ignored" })
        }

        const client = await pool.connect()
        console.log(`Processing Plisio Webhook: Type=${type}, Status=${status}, Amount=${source_amount}`)

        try {
            if (type === "wallet") {
                if (!userId) {
                    console.error("Missing userId in wallet webhook")
                    return NextResponse.json({ error: "Missing userId" }, { status: 400 })
                }

                const amount = parseFloat(source_amount)
                if (isNaN(amount)) {
                    return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
                }

                // Update wallet balance
                await client.query(`
                UPDATE public.users
                SET balance = balance + $2, updated_at = NOW()
                WHERE id = $1
             `, [userId, amount])

                // Log transaction if table exists (optional, skipping for safety if unknown)

            } else if (type === "order") {
                if (!id) {
                    console.error("Missing Order ID in order webhook")
                    return NextResponse.json({ error: "Missing orderId" }, { status: 400 })
                }

                await client.query(`
                UPDATE public.orders 
                SET status = 'completed', payment_id = $1, updated_at = NOW()
                WHERE id = $2
             `, [txn_id, id])
            }

        } catch (dbError) {
            console.error("Webhook DB Error:", dbError)
            return NextResponse.json({ error: "DB Error" }, { status: 500 })
        } finally {
            client.release()
        }

        return NextResponse.json({ status: "ok" })
    } catch (err) {
        console.error("Webhook Error:", err)
        return NextResponse.json({ error: "Webhook failed" }, { status: 500 })
    }
}
