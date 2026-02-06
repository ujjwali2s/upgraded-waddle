import pool from "@/lib/db"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Package, Users, ShoppingCart, DollarSign } from "lucide-react"

export default async function AdminDashboardPage() {
  const client = await pool.connect()
  let totalProducts = 0
  let totalUsers = 0
  let totalOrders = 0
  let totalRevenue = 0

  try {
    const productQuery = client.query("SELECT COUNT(*) FROM products")
    const userQuery = client.query("SELECT COUNT(*) FROM users")
    const orderQuery = client.query("SELECT COUNT(*) FROM orders")
    const revenueQuery = client.query("SELECT SUM(total) FROM orders WHERE status = 'completed' OR status = 'delivered'")

    const [prodRes, userRes, orderRes, revRes] = await Promise.all([
      productQuery,
      userQuery,
      orderQuery,
      revenueQuery
    ])

    totalProducts = parseInt(prodRes.rows[0].count)
    totalUsers = parseInt(userRes.rows[0].count)
    totalOrders = parseInt(orderRes.rows[0].count)
    totalRevenue = parseFloat(revRes.rows[0].sum || "0")

  } finally {
    client.release()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your store performance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {totalProducts}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {totalUsers}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Orders
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {totalOrders}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              ${totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
