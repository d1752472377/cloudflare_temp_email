"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { ConsolePage } from "@/components/console/console-page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function AboutPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin_about"],
    queryFn: async () => {
      const { data } = await api.get<{ version?: string; [key: string]: unknown }>("/open_api/open_settings")
      return data
    },
  })

  return (
    <ConsolePage title="关于" description="系统信息与版本">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cloudflare Temp Email</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">版本:</span>
                <Badge variant="secondary">{data?.version || "未知"}</Badge>
              </div>
              <Separator />
              <div className="text-sm leading-relaxed text-muted-foreground">
                <p>基于 Cloudflare Workers 的临时邮箱服务。</p>
                <p className="mt-2">
                  功能包括：临时邮箱创建、邮件收发、附件管理、自动回复、Webhook 推送、
                  AI 邮件提取、SMTP/IMAP 代理、多语言支持等。
                </p>
                <p className="mt-2">
                  GitHub: github.com/your-repo/cloudflare_temp_email
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </ConsolePage>
  )
}
