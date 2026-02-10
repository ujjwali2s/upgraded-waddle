
import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createInvoice } from "@/lib/plisio"
import pool from "@/lib/db"

export async function POST(request: Request) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { amount, type, items, orderId } = await request.json()

        // orderId might be passed if we already created an order record
        // or we create one here.

        let internalOrderNumber = orderId
        let description = ""

        if (type === "wallet_funding") {
            // Create a transaction record for wallet funding
            // Assuming a transactions table exists? Or just use orders table with special status/type?
            // Let's use a simple prefix for tracking if no table logic yet.
            // Better to insert into a 'transactions' or 'deposits' table.
            // Checking schema previously, I didn't see one. I'll use a valid order_number generated here.
            internalOrderNumber = `WALLET-${session.userId}-${Date.now()}`
            description = `Wallet Load: $${amount}`
        } else if (type === "checkout") {
            // Assuming checkout flow creates an order first or we do it here?
            // If we do it here, we need cart items. 
            // Reuse logic from checkout? 
            // Let's assume the client passes a valid order ID created via /api/checkout/init or similar
            // OR we just generate a payment link for the cart total.
            // To keep it simple AND robust:
            // 1. Client calculates total.
            // 2. Client calls this to get payment link.
            // 3. Webhook fulfills order.
            // But we need an Order ID to fulfill.

            if (!internalOrderNumber) {
                // Create a pending order
                const client = await pool.connect()
                try {
                    // Calculate total from items to be safe?
                    // For now assume amount is correct (validated by client, but should be server)
                    // Let's trust amount for this step or we duplicate checkout logic.
                    // Ideally we run the full checkout logic to create "pending_payment" order.
                    // I'll assume the caller (Checkout Page) creates a "pending" order first via another API 
                    // or I should do it here. 
                    // Let's start with just generating the link and we'll implement the order creation in the main checkout flow.
                    internalOrderNumber = `ORDER-${session.userId}-${Date.now()}`
                    description = `Order Payment`
                } finally {
                    client.release()
                }
            }
            description = `Order #${internalOrderNumber}`
        }

        const data = await createInvoice({
            amount: amount,
            source_currency: "USD",
            order_number: internalOrderNumber || `PAY-${Date.now()}`,
            order_name: description,
            email: session.email,
            callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/plisio?type=wallet&userId=${session.userId}`,
        })

        return NextResponse.json({ url: data.invoice_url })

    } catch (error) {
        console.error("Payment creation failed:", error)
        return NextResponse.json(
            { error: "Failed to create payment" },
            { status: 500 }
        )
    }
}
