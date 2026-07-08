"use client"

import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { ConsolePage } from "@/components/console/console-page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Mail, AtSign, Users, Send, Activity, Clock } from "lucide-react"
import type { AdminStatistics } from "@/lib/types"

const statIcons = [Mail, AtSign, Activity, Clock, Users, Send]
const statLabels: Record<string, string> = {
  mailCount: "总邮件数",
  addressCount: "邮箱地址",
  activeAddressCount7days: "7天活跃",
  activeAddressCount30days: "30天活跃",
  userCount: "注册用户",
  sendMailCount: "发件数",
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin_statistics"],
    queryFn: async () => {
      const { data } = await api.get<AdminStatistics>("/admin/statistics")
      return data
    },
  })

  const entries = stats
    ? Object.entries(stats).map(([key, value], i) => ({
        key,
        label: statLabels[key] || key,
        value: typeof value === "number" ? value.toLocaleString() : String(value),
        Icon: statIcons[i % statIcons.length],
      }))
    : []

  return (
    <ConsolePage title="仪表盘" description="系统概览">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)
          : entries.map((s) => (
              <Card key={s.key}>
                <CardHeader className="flex-row items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <s.Icon className="size-4" />
                  </div>
                  <CardTitle className="text-sm">{s.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-bold">{s.value}</span>
                </CardContent>
              </Card>
            ))}
      </div>
    </ConsolePage>
  )
}
