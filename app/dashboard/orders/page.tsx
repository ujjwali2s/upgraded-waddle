import { getSession } from "@/lib/session"
import pool from "@/lib/db"
import { redirect } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"

function statusColor(status: string) {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200"
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-200"
    case "refunded":
      return "bg-blue-100 text-blue-700 border-blue-200"
    default:
      return "bg-muted text-muted-foreground"
  }
}



export default async function OrdersPage() {
  const session = await getSession()
  if (!session) redirect("/auth/login")

  const client = await pool.connect()
  let orders = []

  try {
    const { rows: orderRows } = await client.query(`
        SELECT * FROM public.orders 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `, [session.userId])

    const { rows: itemRows } = await client.query(`SELECT * FROM public.order_items`) // Optimization: Filter by order_ids is better but this is consistent for now

    orders = orderRows.map(order => ({
      ...order,
      order_items: itemRows.filter(i => i.order_id === order.id)
    }))
  } finally {
    client.release()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Orders</h1>
        <p className="text-muted-foreground">
          View your order history and status.
        </p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16">
          <Package className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">
            No orders yet
          </p>
          <p className="text-sm text-muted-foreground">
            Your orders will appear here after you make a purchase.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
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
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {order.order_items?.map(
                    (item: {
                      id: string
                      product_name: string
                      quantity: number
                      price: number
                    }) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-card-foreground">
                          {item.product_name}{" "}
                          <span className="text-muted-foreground">
                            x{item.quantity}
                          </span>
                        </span>
                        <span className="font-medium text-card-foreground">
                          ${(Number(item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    )
                  )}
                  <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                    <span className="text-sm font-semibold text-card-foreground">
                      Total
                    </span>
                    <span className="text-lg font-bold text-card-foreground">
                      ${Number(order.total).toFixed(2)} USD
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
