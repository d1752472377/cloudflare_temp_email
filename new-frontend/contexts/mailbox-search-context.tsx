"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type MailboxSearchContext = {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

const MailboxSearchContext = createContext<MailboxSearchContext>({
  searchQuery: "",
  setSearchQuery: () => {},
})

export function MailboxSearchProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("")
  return (
    <MailboxSearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </MailboxSearchContext.Provider>
  )
}

export function useMailboxSearch() {
  return useContext(MailboxSearchContext)
}
