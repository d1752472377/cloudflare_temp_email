"use client"

import { Suspense, useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Mail, ArrowLeft } from "lucide-react"

import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

interface TelegramMail {
  id: number
  address: string
  source: string
  subject?: string
  body?: string
  html?: string
  created_at: string
  attachments?: Array<{ filename: string; size: number }>
}

function getInitData(): string {
  if (typeof window !== "undefined") {
    try {
      const win = window as unknown as { Telegram?: { WebApp?: { initData?: string } } }
      if (win.Telegram?.WebApp?.initData) return win.Telegram.WebApp.initData
    } catch { /* ignore */ }
  }
  return ""
}

function MailContent() {
  const searchParams = useSearchParams()
  const mailId = searchParams.get("id")
  const [initData, setInitData] = useState("")

  useEffect(() => {
    setInitData(getInitData())
  }, [])

  const { data: mail, isLoading } = useQuery({
    queryKey: ["tg_mail", mailId, initData],
    queryFn: async () => {
      const { data } = await api.post<TelegramMail>("/telegram/get_mail", { initData, mailId: Number(mailId) })
      return data
    },
    enabled: !!initData && !!mailId,
  })

  if (!initData) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background p-6">
        <p className="text-sm text-muted-foreground">请通过 Telegram Mini App 访问此页面。</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (!mail) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6">
        <Mail className="mb-4 size-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">邮件不存在或无权访问。</p>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background p-4">
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => window.history.back()}>
          <ArrowLeft className="size-3.5" /> 返回
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{mail.subject || "(无主题)"}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 text-sm">
              <span>发件人: <span className="font-medium">{mail.source}</span></span>
              <span>收件人: <span className="font-mono text-xs">{mail.address}</span></span>
              <span className="text-xs text-muted-foreground">{mail.created_at}</span>
            </div>
            <Separator />
            {mail.html ? (
              <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: mail.html }} />
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {mail.body || "(邮件内容为空)"}
              </div>
            )}
            {mail.attachments && mail.attachments.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">附件 ({mail.attachments.length})</span>
                  {mail.attachments.map((a, i) => (
                    <span key={i} className="text-xs text-muted-foreground">
                      {a.filename} ({(a.size / 1024).toFixed(1)} KB)
                    </span>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function TelegramMailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh items-center justify-center bg-background">
        <Spinner className="size-6" />
      </div>
    }>
      <MailContent />
    </Suspense>
  )
}
