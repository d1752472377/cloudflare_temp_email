"use client"

import type { ReactNode } from "react"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"

export function MailboxHeader({
  title,
  actions,
}: {
  title: string
  actions?: ReactNode
}) {
  return (
    <header className="sticky top-0 z-10 flex min-h-16 shrink-0 items-center gap-3 border-b border-border/70 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="hidden h-5 sm:block" />
      <h1 className="min-w-0 flex-1 truncate text-base font-semibold">{title}</h1>
      <div className="flex shrink-0 items-center gap-2">
        {actions ?? (
          <Button variant="ghost" size="icon" aria-label="刷新">
            <RefreshCw />
          </Button>
        )}
      </div>
    </header>
  )
}

export function MailboxContent({ children }: { children: ReactNode }) {
  return <SidebarInset className="h-svh overflow-hidden bg-muted/20">{children}</SidebarInset>
}
