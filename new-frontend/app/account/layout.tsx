"use client"

import type { ReactNode } from "react"
import { useContext } from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { Topbar } from "@/components/topbar"
import { I18nContext } from "@/contexts/i18n-context"
import { ClientOnly } from "@/components/client-only"

export default function AccountLayout({ children }: { children: ReactNode }) {
  const { locale, setLocale } = useContext(I18nContext)

  return (
    <ClientOnly>
      <AuthGuard>
        <TooltipProvider>
          <SidebarProvider>
            <div className="flex h-svh w-full">
              <AppSidebar currentLocale={locale} onLocaleChange={setLocale} />
              <div className="flex flex-1 flex-col overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-hidden">
                  {children}
                </main>
              </div>
            </div>
          </SidebarProvider>
        </TooltipProvider>
      </AuthGuard>
    </ClientOnly>
  )
}
