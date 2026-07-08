"use client"

import type { ReactNode } from "react"
import { useContext } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthGuard } from "@/components/auth/auth-guard"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { Topbar } from "@/components/topbar"
import { I18nContext } from "@/contexts/i18n-context"
import { ClientOnly } from "@/components/client-only"

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { locale, setLocale } = useContext(I18nContext)

  return (
    <ClientOnly>
      <AuthGuard requireAdmin>
        <TooltipProvider>
          <SidebarProvider>
            <div className="flex h-svh w-full">
              <AppSidebar currentLocale={locale} onLocaleChange={setLocale} />
              <div className="flex flex-1 flex-col overflow-hidden">
                <Topbar variant="admin" />
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
