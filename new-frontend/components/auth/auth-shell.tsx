import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6"
        render={<Link href="/" />}
      >
        <ArrowLeft className="size-4" />
        返回首页
      </Button>
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <Link href="/" className="mb-4 flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Mail className="size-5" />
            </div>
            <span className="text-xl font-bold">匿名邮箱</span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
        {footer ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </p>
        ) : null}
      </div>
    </div>
  )
}
