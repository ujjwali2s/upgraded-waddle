import pool from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart } from "lucide-react"
import { OrderActions } from "@/components/admin/order-actions"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function statusColor(status: string) {
  switch (status) {
    case "completed":
    case "delivered":
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200"
    case "processing":
    case "received":
      return "bg-blue-100 text-blue-700 border-blue-200"
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-200"
    case "refunded":
      return "bg-purple-100 text-purple-700 border-purple-200"
    default:
      return "bg-muted text-muted-foreground"
  }
}

export default async function AdminOrdersPage(props: {
  searchParams: Promise<{ userId?: string; status?: string }>
}) {
  const searchParams = await props.searchParams
  const client = await pool.connect()
  let orders = []
  const userId = searchParams?.userId
  const status = searchParams?.status

  try {
    // Fetch orders
    let query = `
        SELECT o.*, u.full_name, u.email as username 
        FROM public.orders o
        LEFT JOIN public.users u ON o.user_id = u.id
      `

    const values = []
    const conditions = []

    if (userId) {
      values.push(userId)
      conditions.push(`o.user_id = $${values.length}`)
    }

    if (status) {
      values.push(status)
      conditions.push(`o.status = $${values.length}`)
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(" AND ")
    }

    query += ` ORDER BY o.created_at DESC`

    const { rows: orderRows } = await client.query(query, values)

    // Fetch Items for all orders (Optimization: fetch all at once or lazily, for now simple loop is okay if low traffic, BUT separate query is better)
    // Actually, let's fetch items separately and attach
    const { rows: itemRows } = await client.query(`SELECT * FROM public.order_items`)

    orders = orderRows.map((order: any) => ({
      ...order,
      profiles: { full_name: order.full_name, username: order.username }, // Map user data
      order_items: itemRows.filter((i: any) => i.order_id === order.id)
    }))

  } finally {
    client.release()
  }

  const filterButton = (s: string | undefined, label: string) => (
    <Button
      variant={status === s ? "default" : "outline"}
      size="sm"
      asChild
      className="capitalize"
    >
      <Link href={`/admin/orders?${new URLSearchParams({
        ...(userId ? { userId } : {}),
        ...(s ? { status: s } : {})
      }).toString()}`}>
        {label}
      </Link>
    </Button>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {userId ? "User Orders" : "Orders"}
          </h1>
          <p className="text-muted-foreground">
            {userId ? "Viewing orders for specific user." : "View and manage all orders."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterButton(undefined, "All")}
        {filterButton("received", "Received")}
        {filterButton("processing", "Processing")}
        {filterButton("delivered", "Delivered")}
        {filterButton("pending", "Pending")}
        {filterButton("cancelled", "Cancelled")}
      </div>

      {!orders || orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16">
          <ShoppingCart className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">
            No orders found
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order: any) => {
            const profile = order.profiles as {
              full_name: string | null
              username: string | null
            } | null
            return (
              <Card key={order.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-medium text-card-foreground">
                          Order #{order.id.slice(0, 8)}
                        </CardTitle>
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        By: {profile?.full_name || profile?.username || "Unknown"}{" "}
                        |{" "}
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                      {order.description && (
                        <p className="mt-1 text-xs italic text-muted-foreground">
                          Note: {order.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-card-foreground">
                        ${Number(order.total).toFixed(2)}
                      </span>
                      <OrderActions order={order} />
                    </div>
                  </div>
                </CardHeader>
                {order.order_items && order.order_items.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="flex flex-col gap-1">
                      {order.order_items.map(
                        (item: {
                          id: string
                          product_name: string
                          quantity: number
                          price: number
                        }) => (
                          <div
                            key={item.id}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-muted-foreground">
                              {item.product_name} x{item.quantity}
                            </span>
                            <span className="text-card-foreground">
                              ${(Number(item.price) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
