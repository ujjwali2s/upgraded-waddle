import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const secretKey = process.env.SESSION_SECRET || "default_secret_key_change_me"
const encodedKey = new TextEncoder().encode(secretKey)

export async function middleware(request: NextRequest) {
  const session = request.cookies.get("auth_session")?.value
  const { pathname } = request.nextUrl

  let isAuthenticated = false
  let role = ""

  if (session) {
    try {
      const { payload } = await jwtVerify(session, encodedKey, {
        algorithms: ["HS256"],
      })
      isAuthenticated = true
      role = (payload.role as string) || "user"
    } catch (err) {
      // Invalid token
      isAuthenticated = false
    }
  }

  // Define protected and auth routes
  const isProtectedRoute = pathname.startsWith("/dashboard")
  const isAuthRoute = pathname.startsWith("/auth")
  const isAdminRoute = pathname.startsWith("/admin")
  const isAdminLogin = pathname === "/admin/login"

  // Redirect Logic

  // 1. Dashboard Protection
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // 2. Auth Routes (Login/Signup) - Redirect if logged in
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // 3. Admin Routes Protection
  if (isAdminRoute && !isAdminLogin) {
    if (!isAuthenticated || role !== "admin") {
      // If not logged in, or logged in as regular user, go to admin login
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  // 4. Admin Login - Redirect if already admin
  if (isAdminLogin && isAuthenticated && role === "admin") {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*", "/admin/:path*"],
}
