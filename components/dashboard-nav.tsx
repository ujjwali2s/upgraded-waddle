"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  Wallet,
  User,
  ShoppingCart,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/orders", label: "My Orders", icon: Package },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/profile", label: "Profile", icon: User },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-full shrink-0 lg:block lg:w-56">
      <nav className="flex flex-row gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1.5 lg:flex-col">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
