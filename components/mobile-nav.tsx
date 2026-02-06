"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Package,
    Wallet,
    User,
    Menu,
    ShoppingCart,
    Shield,
    LogOut,
    Home,
    Sun,
    Moon,
    Tag
} from "lucide-react"

import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface MobileNavProps {
    user: { id: string; email: string } | null
    profile: any | null
    categories: Array<{
        id: string
        name: string
        slug: string
    }>
}

export function MobileNav({ user, profile, categories }: MobileNavProps) {
    const pathname = usePathname()
    const [open, setOpen] = React.useState(false)
    const { theme, setTheme } = useTheme()

    return (
        <div className="flex items-center gap-2 sm:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="flex flex-col gap-6">
                    <SheetHeader className="text-left">
                        {user ? (
                            <div className="flex flex-col gap-1 border-b pb-4">
                                <SheetTitle className="font-semibold text-lg">
                                    {profile?.full_name || profile?.username || "My Account"}
                                </SheetTitle>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                <div className="mt-2 flex items-center gap-2 text-primary font-medium">
                                    <Wallet className="h-4 w-4" />
                                    <span>${Number(profile?.balance || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        ) : (
                            <SheetTitle>Menu</SheetTitle>
                        )}
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto">
                        <div className="grid gap-2">
                            {/* Dashboard Links (Only if logged in) */}
                            {user && (
                                <div className="grid gap-1 mb-4">
                                    <p className="text-xs font-medium text-muted-foreground px-2 mb-2 uppercase">Dashboard</p>
                                    <Link
                                        href="/dashboard"
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                            pathname === "/dashboard" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                        )}
                                    >
                                        <LayoutDashboard className="h-4 w-4" />
                                        Overview
                                    </Link>
                                    <Link
                                        href="/dashboard/orders"
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                            pathname.startsWith("/dashboard/orders") ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                        )}
                                    >
                                        <Package className="h-4 w-4" />
                                        My Orders
                                    </Link>
                                    <Link
                                        href="/dashboard/wallet"
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                            pathname.startsWith("/dashboard/wallet") ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                        )}
                                    >
                                        <Wallet className="h-4 w-4" />
                                        Wallet
                                    </Link>
                                    <Link
                                        href="/dashboard/profile"
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                            pathname.startsWith("/dashboard/profile") ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                        )}
                                    >
                                        <User className="h-4 w-4" />
                                        Profile
                                    </Link>
                                    {profile?.role === "admin" && (
                                        <Link
                                            href="/admin"
                                            onClick={() => setOpen(false)}
                                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 mt-1"
                                        >
                                            <Shield className="h-4 w-4" />
                                            Admin Panel
                                        </Link>
                                    )}
                                </div>
                            )}

                            {/* Global Links */}
                            <div className="grid gap-1">
                                <p className="text-xs font-medium text-muted-foreground px-2 mb-2 uppercase">Menu</p>
                                <Link
                                    href="/"
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                >
                                    <Home className="h-4 w-4" />
                                    Store
                                </Link>
                                <Link
                                    href="/cart"
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                >
                                    <ShoppingCart className="h-4 w-4" />
                                    Cart
                                </Link>
                            </div>

                            {/* Categories */}
                            {categories.length > 0 && (
                                <div className="grid gap-1 mt-4">
                                    <p className="text-xs font-medium text-muted-foreground px-2 mb-2 uppercase flex items-center gap-1">
                                        <Tag className="h-3 w-3" />
                                        Categories
                                    </p>
                                    <Link
                                        href="/"
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                            pathname === "/" ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                        )}
                                    >
                                        All Products
                                    </Link>
                                    {categories.map((cat) => (
                                        <Link
                                            key={cat.id}
                                            href={`/category/${cat.slug}`}
                                            onClick={() => setOpen(false)}
                                            className={cn(
                                                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                                                pathname.includes(`/category/${cat.slug}`) ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                            )}
                                        >
                                            {cat.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t pt-4 space-y-2">
                        <Button
                            variant="ghost"
                            className="flex w-full items-center justify-start gap-2"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        >
                            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="ml-2">Toggle Theme</span>
                        </Button>

                        {!user ? (
                            <div className="grid gap-2">
                                <Link href="/auth/login" onClick={() => setOpen(false)}>
                                    <Button variant="outline" className="w-full justify-start">Login</Button>
                                </Link>
                                <Link href="/auth/sign-up" onClick={() => setOpen(false)}>
                                    <Button className="w-full justify-start">Register</Button>
                                </Link>
                            </div>
                        ) : (
                            <Button
                                variant="ghost"
                                className="flex w-full items-center justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={async () => {
                                    await fetch("/api/auth/logout", { method: "POST" })
                                    window.location.href = "/"
                                }}
                            >
                                <LogOut className="h-4 w-4" />
                                Sign Out
                            </Button>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
