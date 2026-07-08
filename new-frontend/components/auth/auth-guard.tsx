"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/contexts/auth-context"
import { Spinner } from "@/components/ui/spinner"

function hasAddressJwt(): boolean {
  if (typeof window === "undefined") return false
  const jwt = localStorage.getItem("jwt")
  return !!jwt && jwt !== "undefined" && jwt !== "null"
}

function hasAdminAuth(): boolean {
  if (typeof window === "undefined") return false
  const aa = localStorage.getItem("adminAuth")
  return !!aa && aa !== "undefined" && aa !== "null"
}

export function AuthGuard({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode
  requireAdmin?: boolean
}) {
  const { isLoggedIn, isAdmin, loading } = useAuth()
  const router = useRouter()
  const mounted = useRef(false)

  // Check localStorage tokens synchronously so we don't flash-redirect
  const [localTokens] = useState(() => ({
    hasJwt: hasAddressJwt(),
    hasAdmin: hasAdminAuth(),
  }))

  // Can access if:
  // - user is logged in (has user session from context), OR
  // - has address JWT (address-only login), OR
  // - admin page and has admin auth (admin-only login)
  const canAccess =
    isLoggedIn ||
    (!requireAdmin && localTokens.hasJwt) ||
    (requireAdmin && localTokens.hasAdmin)

  useEffect(() => {
    if (loading) return
    if (!mounted.current) {
      mounted.current = true
      const timer = setTimeout(() => {
        if (!canAccess) router.replace("/login")
        else if (requireAdmin && !isAdmin && !localTokens.hasAdmin)
          router.replace("/mailbox/inbox")
      }, 0)
      return () => clearTimeout(timer)
    }
    if (!canAccess) {
      router.replace("/login")
      return
    }
    if (requireAdmin && !isAdmin && !localTokens.hasAdmin) {
      router.replace("/mailbox/inbox")
    }
  }, [loading, canAccess, isAdmin, requireAdmin, router, localTokens])

  if (loading && !localTokens.hasJwt && !localTokens.hasAdmin) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (!canAccess) return null
  if (requireAdmin && !isAdmin && !localTokens.hasAdmin) return null

  return <>{children}</>
}
