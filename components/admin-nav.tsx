"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Package,
  Tag,
  Users,
  ShoppingCart,
  Wallet,
  Package2,
} from "lucide-react"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/stock", label: "Stock", icon: Package2 },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/wallets", label: "Balance", icon: Wallet },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <aside className="w-full shrink-0 lg:w-56">
      <div className="mb-3 flex items-center gap-2 px-1">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-accent text-accent-foreground">
          <LayoutDashboard className="h-3.5 w-3.5" />
        </div>
        <span className="text-sm font-semibold text-foreground">
          Admin Panel
        </span>
      </div>
      <nav className="flex flex-row gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1.5 lg:flex-col">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
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
