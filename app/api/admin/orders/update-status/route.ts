import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { getSession } from "@/lib/session"

export async function POST(request: Request) {
    try {
        const session = await getSession()

        // Strict Admin Check
        if (!session || session.role !== "admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { orderId, status, description } = await request.json()

        if (!orderId || !status) {
            return NextResponse.json({ error: "Order ID and Status are required" }, { status: 400 })
        }

        // Validate Status
        const validStatuses = ["pending", "processing", "completed", "cancelled", "refunded", "received", "delivered"]
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 })
        }

        const client = await pool.connect()
        try {
            // Update Order
            // We append description if provided? Or replace? 
            // User asked "change status with description everytime".
            // So we update both.

            const result = await client.query(
                `UPDATE public.orders 
                 SET status = $1, description = $2, updated_at = NOW() 
                 WHERE id = $3 
                 RETURNING *`,
                [status, description || null, orderId]
            )

            if (result.rowCount === 0) {
                return NextResponse.json({ error: "Order not found" }, { status: 404 })
            }

            return NextResponse.json({ success: true, order: result.rows[0] })
        } finally {
            client.release()
        }
    } catch (error) {
        console.error("Update Order Status Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
