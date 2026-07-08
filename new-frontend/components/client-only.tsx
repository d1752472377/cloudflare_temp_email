"use client"

import { useEffect, useState, type ReactNode } from "react"

export function ClientOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return fallback || <div className="flex h-svh w-full" />
  return <>{children}</>
}
