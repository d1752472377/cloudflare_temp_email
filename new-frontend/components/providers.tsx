"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/contexts/auth-context"
import { I18nProvider } from "@/contexts/i18n-context"
import { OpenSettingsProvider } from "@/contexts/open-settings-context"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <OpenSettingsProvider>
          <AuthProvider>{children}</AuthProvider>
        </OpenSettingsProvider>
      </I18nProvider>
    </QueryClientProvider>
  )
}
