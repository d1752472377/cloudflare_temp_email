"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { ConsolePage } from "@/components/console/console-page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"

type WebhookLog = {
  id: number
  address: string
  url: string
  status: number
  request_body: string
  response_body: string
  created_at: string
}

export default function WebhookLogsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin_webhook_logs"],
    queryFn: async () => {
      const { data } = await api.get<{ results: WebhookLog[]; count: number }>("/admin/webhook_logs?limit=50")
      return data
    },
  })

  return (
    <ConsolePage title="Webhook 日志" description="查看所有 Webhook 推送历史">
      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : (
        <div className="flex flex-col gap-3">
          {data?.results?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                暂无 Webhook 日志
              </CardContent>
            </Card>
          ) : (
            data?.results?.map((log) => (
              <Card key={log.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{log.url}</CardTitle>
                    <Badge variant={log.status >= 200 && log.status < 300 ? "secondary" : "destructive"}>
                      {log.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    地址: {log.address} · {new Date(log.created_at).toLocaleString()}
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      )}
    </ConsolePage>
  )
}
