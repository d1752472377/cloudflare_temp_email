"use client"

import type { ReactNode } from "react"
import { Topbar } from "@/components/topbar"
import { useMailboxSearch } from "@/contexts/mailbox-search-context"

export function MailboxSearchSync() {
  const { searchQuery, setSearchQuery } = useMailboxSearch()

  return <Topbar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
}

export function MailboxMain({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 overflow-hidden">
      {children}
    </main>
  )
}
