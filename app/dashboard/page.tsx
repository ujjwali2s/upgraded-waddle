import { getSession } from "@/lib/session"
import pool from "@/lib/db"
import { redirect } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, Package, ShoppingCart, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/auth/login")

  const client = await pool.connect()
  try {
    const { rows: profiles } = await client.query('SELECT * FROM public.profiles WHERE id = $1', [session.userId])
    const profile = profiles[0]

    const { rows: wallets } = await client.query('SELECT * FROM public.wallets WHERE user_id = $1', [session.userId])
    const wallet = wallets[0]

    const { rows: orders } = await client.query('SELECT * FROM public.orders WHERE user_id = $1 ORDER BY created_at DESC', [session.userId])

    const totalOrders = orders?.length || 0
    const completedOrders =
      orders?.filter((o: any) => o.status === "completed").length || 0
    const totalSpent =
      orders
        ?.filter((o: any) => o.status === "completed")
        .reduce((sum: number, o: any) => sum + Number(o.total), 0) || 0

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
          </h1>
          <p className="text-muted-foreground">
            Manage your orders, wallet, and profile.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Wallet Balance
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">
                ${Number(wallet?.balance || 0).toFixed(2)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">USD</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{totalOrders}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {completedOrders} completed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Spent
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">
                ${totalSpent.toFixed(2)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">USD</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/">
            <Button variant="outline" className="gap-1.5 bg-transparent">
              <ShoppingCart className="h-4 w-4" />
              Browse Store
            </Button>
          </Link>
          <Link href="/dashboard/orders">
            <Button variant="outline" className="gap-1.5 bg-transparent">
              <Package className="h-4 w-4" />
              View Orders
            </Button>
          </Link>
          <Link href="/dashboard/wallet">
            <Button variant="outline" className="gap-1.5 bg-transparent">
              <Wallet className="h-4 w-4" />
              Manage Wallet
            </Button>
          </Link>
        </div>

        {/* Recent Orders */}
        {orders && orders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-card-foreground">Recent Orders</CardTitle>
              <CardDescription>Your latest purchases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {orders.slice(0, 5).map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-md border border-border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-card-foreground">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          order.status === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : order.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        )}
                      >
                        {order.status}
                      </span>
                      <span className="text-sm font-semibold text-card-foreground">
                        ${Number(order.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  } finally {
    client.release()
  }
}
