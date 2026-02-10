import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import pool from "@/lib/db"
import { sendOrderNotification } from "@/lib/email"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { items, paymentMethod } = (await request.json()) as {
      items: CartItem[]
      paymentMethod: "wallet"
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      )
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Calculate total
      const total = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )

      // Check wallet balance
      if (paymentMethod === "wallet") {
        const { rows: wallets } = await client.query('SELECT * FROM public.wallets WHERE user_id = $1', [session.userId])
        const wallet = wallets[0]

        if (!wallet || Number(wallet.balance) < total) {
          await client.query('ROLLBACK')
          return NextResponse.json(
            { error: "Insufficient wallet balance" },
            { status: 400 }
          )
        }

        // Verify product availability
        for (const item of items) {
          const { rows: products } = await client.query('SELECT availability, status FROM public.products WHERE id = $1', [item.id])
          const product = products[0]

          if (!product || product.status !== "active") {
            await client.query('ROLLBACK')
            return NextResponse.json(
              { error: `Product "${item.name}" is no longer available` },
              { status: 400 }
            )
          }

          if (product.availability < item.quantity) {
            await client.query('ROLLBACK')
            return NextResponse.json(
              { error: `Only ${product.availability} of "${item.name}" available` },
              { status: 400 }
            )
          }
        }

        // Create Order
        const { rows: orders } = await client.query(`
                INSERT INTO public.orders (user_id, status, payment_method, total)
                VALUES ($1, 'completed', 'wallet', $2)
                RETURNING id
            `, [session.userId, total])
        const orderId = orders[0].id

        // Create Order Items
        for (const item of items) {
          await client.query(`
                    INSERT INTO public.order_items (order_id, product_id, product_name, price, quantity)
                    VALUES ($1, $2, $3, $4, $5)
                `, [orderId, item.id, item.name, item.price, item.quantity])
        }

        // Deduct Wallet Balance
        await client.query(`
                UPDATE public.wallets 
                SET balance = balance - $1, updated_at = NOW()
                WHERE user_id = $2
            `, [total, session.userId])

        // Reduce product availability
        for (const item of items) {
          await client.query(`
                    UPDATE public.products 
                    SET availability = availability - $1 
                    WHERE id = $2
                `, [item.quantity, item.id])
        }

        await client.query('COMMIT')

        // Send order notification email to admin
        try {
          // Fetch user email
          const { rows: userRows } = await client.query(
            'SELECT email FROM public.users WHERE id = $1',
            [session.userId]
          )
          const userEmail = userRows[0]?.email || session.email || 'Unknown'

          // Prepare order items for email
          const orderItems = items.map(item => ({
            product_name: item.name,
            quantity: item.quantity,
            price: item.price
          }))

          // Send notification email
          try {
            console.log(`Sending order notification to ${process.env.ORDER_NOTIFICATION_EMAIL || 'Shipspro.orders@gmail.com'} for order ${orderId}`)
            await sendOrderNotification(
              orderId,
              userEmail,
              orderItems,
              total,
              paymentMethod
            )
            console.log(`Order notification sent successfully for order ${orderId}`)
          } catch (emailError) {
            console.error('Failed to send order notification email:', emailError)
            // We still don't fail the order if email fails, but we log it clearly
          }
        } catch (emailError) {
          console.error('Error preparing order notification:', emailError)
        }

        return NextResponse.json({ success: true, orderId })
      }

      await client.query('ROLLBACK')
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      )

    } catch (dbError) {
      await client.query('ROLLBACK')
      console.error("Checkout DB Error:", dbError)
      return NextResponse.json(
        { error: "Transaction failed" },
        { status: 500 }
      )
    } finally {
      client.release()
    }

  } catch (error) {
    console.error("Checkout Request Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
