import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createInvoice } from "@/lib/plisio"
import pool from "@/lib/db"

interface CartItem {
    id: string
    name: string
    price: number
    quantity: number
}

export async function POST(request: Request) {
    const client = await pool.connect()
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { items } = (await request.json()) as {
            items: CartItem[]
        }

        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: "Cart is empty" },
                { status: 400 }
            )
        }

        // 1. Calculate Total
        const total = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        )

        await client.query('BEGIN')

        // 2. Verify Availability & Deduct Stock
        for (const item of items) {
            const { rows: productRows } = await client.query(
                'SELECT availability, status, name FROM public.products WHERE id = $1 FOR UPDATE',
                [item.id]
            )
            const product = productRows[0]

            if (!product) {
                await client.query('ROLLBACK')
                throw new Error(`Product "${item.name}" not found`)
            }

            if (product.status !== "active") {
                await client.query('ROLLBACK')
                throw new Error(`Product "${item.name}" is no longer available`)
            }

            if (product.availability < item.quantity) {
                await client.query('ROLLBACK')
                throw new Error(`Only ${product.availability} of "${item.name}" available`)
            }

            await client.query(
                'UPDATE public.products SET availability = availability - $1 WHERE id = $2',
                [item.quantity, item.id]
            )
        }

        // 3. Create Order
        const { rows: orderRows } = await client.query(
            `INSERT INTO public.orders (user_id, status, payment_method, total)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [session.userId, 'pending', 'plisio', total]
        )
        const orderId = orderRows[0].id

        // 4. Create Order Items
        for (const item of items) {
            await client.query(
                `INSERT INTO public.order_items (order_id, product_id, product_name, price, quantity)
                 VALUES ($1, $2, $3, $4, $5)`,
                [orderId, item.id, item.name, item.price, item.quantity]
            )
        }

        await client.query('COMMIT')

        // 5. Create Plisio Invoice
        try {
            const invoiceData = await createInvoice({
                amount: total,
                source_currency: "USD",
                currency: "USDT_TRX",
                order_number: orderId,
                order_name: `Order #${orderId}`,
                email: session.email,
                callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/plisio?type=order&id=${orderId}`
            })

            return NextResponse.json({
                success: true,
                orderId,
                invoiceUrl: invoiceData.invoice_url
            })
        } catch (plisioError) {
            console.error("Plisio Error", plisioError)
            return NextResponse.json(
                { error: "Failed to generate payment invoice" },
                { status: 500 }
            )
        }

    } catch (error: any) {
        await client.query('ROLLBACK')
        console.error("Crypto Checkout Request Error:", error)
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        )
    } finally {
        client.release()
    }
}
