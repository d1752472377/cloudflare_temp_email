import type { ReactNode } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function ConsolePage({
  title,
  description,
  actions,
  backHref,
  backLabel,
  children,
}: {
  title: string
  description?: string
  actions?: ReactNode
  backHref?: string
  backLabel?: string
  children: ReactNode
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b border-border/70 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
        {backHref ? (
          <Button variant="ghost" size="icon-sm" render={<Link href={backHref} />}>
            <ChevronLeft className="size-4" />
          </Button>
        ) : null}
        <Separator orientation="vertical" className="hidden h-5 sm:block" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold leading-tight">{title}</h1>
          {description ? (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:py-6">
          {children}
        </div>
      </div>
    </div>
  )
}
