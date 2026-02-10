
import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { sendOrderNotification } from "@/lib/email"
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

    // check payment method
    if (paymentMethod !== "wallet") {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 })
    }

    // 1. Calculate total
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    )

    await client.query('BEGIN')

    // 2. Check Wallet Balance
    const { rows: userRows } = await client.query(
      'SELECT balance FROM public.users WHERE id = $1 FOR UPDATE',
      [session.userId]
    )
    const user = userRows[0]

    if (!user || Number(user.balance) < total) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: "Insufficient wallet balance" }, { status: 400 })
    }

    // 3. Verify Product and Deduct Stock
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

    // 4. Deduct Wallet Balance
    await client.query(
      'UPDATE public.users SET balance = balance - $1 WHERE id = $2',
      [total, session.userId]
    )

    // 5. Create Order
    const { rows: orderRows } = await client.query(
      `INSERT INTO public.orders (user_id, status, payment_method, total)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [session.userId, 'pending', 'wallet', total]
    )
    const orderId = orderRows[0].id

    // 6. Create Order Items
    for (const item of items) {
      await client.query(
        `INSERT INTO public.order_items (order_id, product_id, product_name, price, quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.id, item.name, item.price, item.quantity]
      )
    }

    await client.query('COMMIT')

    // 7. Send Notification
    try {
      const { rows: emailRows } = await client.query(
        'SELECT email FROM public.users WHERE id = $1',
        [session.userId]
      )
      const userEmail = emailRows[0]?.email || session.email || 'Unknown'

      // Prepare order items for email
      const emailItems = items.map(item => ({
        product_name: item.name,
        quantity: item.quantity,
        price: item.price
      }))

      await sendOrderNotification(
        orderId,
        userEmail,
        emailItems,
        total,
        paymentMethod
      )
    } catch (emailError) {
      console.error('Email notification failed', emailError)
    }

    return NextResponse.json({ success: true, orderId })

  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error("Checkout Request Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
