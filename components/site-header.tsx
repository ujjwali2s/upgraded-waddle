import Link from "next/link"
import { getSession } from "@/lib/session"
import pool from "@/lib/db"
import { createClient } from "@/lib/supabase/server"
import { Package, ShoppingCart, User, LogOut, LayoutDashboard, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SignOutButton } from "@/components/sign-out-button"
import { MobileNav } from "@/components/mobile-nav"
import { ThemeToggle } from "@/components/theme-toggle"

export async function SiteHeader() {
  let user = null
  let profile = null
  let categories: Array<{
    id: string
    name: string
    slug: string
  }> = []

  try {
    const session = await getSession()
    if (session) {
      user = { id: session.userId, email: session.email } // Mock user object for UI compatibility

      const client = await pool.connect()
      try {
        // Fetch profile - Adjust query if you merged users/profiles or kept them separate
        // Based on previous files, we have public.users and public.profiles
        const { rows } = await client.query(`
                SELECT u.role, p.full_name, p.username, w.balance
                FROM public.users u
                LEFT JOIN public.profiles p ON u.id = p.id
                LEFT JOIN public.wallets w ON u.id = w.user_id
                WHERE u.id = $1
            `, [session.userId])

        if (rows.length > 0) {
          profile = rows[0]
        }
      } finally {
        client.release()
      }
    }

    // Fetch categories for mobile nav
    const supabase = await createClient()
    const { data: catData } = await supabase
      .from("categories")
      .select("id, name, slug")
      .order("name")

    if (catData) categories = catData
  } catch (error) {
    console.error("SiteHeader auth error:", error)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/images/logo.png"
            alt="ShipsPro Logo"
            className="h-12 w-12 rounded-full"
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight text-foreground">
              ShipsPro
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Global Air Cargo
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {/* Desktop User Menu */}
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/cart">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
                <span className="sr-only">Cart</span>
              </Button>
            </Link>
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {profile?.username || profile?.full_name || user.email?.split("@")[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/orders" className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  {profile?.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <SignOutButton />
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button size="sm">Register</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Nav */}
          <MobileNav user={user} profile={profile} categories={categories} />
        </div>
      </div>
    </header>
  )
}
