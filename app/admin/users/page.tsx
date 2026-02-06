import pool from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, ShoppingBag } from "lucide-react"

export default async function AdminUsersPage() {
  const client = await pool.connect()
  let profiles = []

  try {
    const { rows } = await client.query(`
        SELECT u.id, u.email, u.role, u.full_name, u.is_verified, 
               w.balance
        FROM public.users u
        LEFT JOIN public.wallets w ON u.id = w.user_id
        ORDER BY u.created_at DESC
      `)

    // Map to match existing structure or update component
    profiles = rows.map(r => ({
      ...r,
      wallets: [{ balance: r.balance || 0 }] // Keeping structure compatible for now
    }))
  } finally {
    client.release()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground">
          View and manage registered users.
        </p>
      </div>

      {!profiles || profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card py-16">
          <Users className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">
            No users yet
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {profiles.map((profile) => (
            <Card key={profile.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-card-foreground">
                      {profile.full_name || profile.username || "Unnamed User"}
                    </h3>
                    <Badge
                      variant={
                        profile.role === "admin" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {profile.role}
                    </Badge>
                    {profile.is_blocked && (
                      <Badge variant="destructive" className="text-xs">
                        Blocked
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {profile.email}
                    {profile.username && ` | @${profile.username}`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href={`/admin/orders?userId=${profile.id}`}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                    title="View Orders"
                  >
                    <ShoppingBag className="h-4 w-4" />
                  </a>
                  <div className="text-right">
                    <p className="font-semibold text-card-foreground">
                      $
                      {Number(
                        (profile.wallets as { balance: number }[] | null)?.[0]
                          ?.balance || 0
                      ).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">Wallet Balance</p>
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
