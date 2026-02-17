import Link from "next/link"
import { cache } from "react"
import { getSession } from "@/lib/session"
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

// Cache user profile data for the duration of the request
const getUserProfile = cache(async (userId: string) => {
  try {
    const supabase = await createClient()
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, balance, full_name, username')
      .eq('id', userId)
      .single()

    if (userData && !userError) {
      // If full_name is "test" or empty, and username is null, we'll prefer the email prefix eventually
      // But for now, just return the data as is. The display logic will handle the fallbacks.
      return {
        role: userData.role,
        full_name: userData.full_name,
        username: userData.username,
        balance: userData.balance
      }
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
  }
  return null
})

// Cache categories for the duration of the request
const getCategories = cache(async () => {
  try {
    const supabase = await createClient()
    const { data: catData } = await supabase
      .from("categories")
      .select("id, name, slug")
      .order("name")

    return catData || []
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
})

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

    // Execute queries in parallel for better performance
    const [profileData, categoriesData] = await Promise.all([
      session ? getUserProfile(session.userId) : Promise.resolve(null),
      getCategories()
    ])

    if (session) {
      user = { id: session.userId, email: session.email }
      profile = profileData
    }

    categories = categoriesData
  } catch (error) {
    console.error("SiteHeader error:", error)
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
                      {profile?.username || ((profile?.full_name && profile.full_name !== 'test') ? profile.full_name : user.email?.split("@")[0])}
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
