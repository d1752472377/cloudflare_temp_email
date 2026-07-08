"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { RefreshCw, Zap } from "lucide-react"

import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { TelegramSettings, TelegramStatus } from "@/lib/types"

export function TelegramSettingsPanel() {
  const [settings, setSettings] = useState<TelegramSettings | null>(null)

  const { isLoading } = useQuery({
    queryKey: ["telegram_settings"],
    queryFn: async () => {
      const { data } = await api.get<TelegramSettings>("/admin/telegram/settings")
      setSettings(data)
      return data
    },
  })

  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ["telegram_status"],
    queryFn: async () => {
      const { data } = await api.get<TelegramStatus>("/admin/telegram/status")
      return data
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => api.post("/admin/telegram/settings", settings),
    onSuccess: () => toast.success("设置已保存"),
    onError: () => toast.error("保存失败"),
  })

  const initMutation = useMutation({
    mutationFn: () => api.post("/admin/telegram/init"),
    onSuccess: () => { toast.success("Webhook 初始化成功"); refetchStatus() },
    onError: () => toast.error("初始化失败"),
  })

  if (isLoading || !settings) return <Skeleton className="h-48 w-full" />

  return (
    <div className="flex flex-col gap-4">
      <FieldGroup>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>启用 Telegram 白名单</FieldLabel>
            <Switch checked={settings.enableTelegramAllowList} onCheckedChange={(v) => setSettings({ ...settings, enableTelegramAllowList: v })} />
          </div>
        </Field>
        {settings.enableTelegramAllowList && (
          <Field>
            <FieldLabel>白名单（每行一个 Telegram User ID）</FieldLabel>
            <textarea className="min-h-[80px] w-full rounded-md border border-border bg-background p-2 text-sm" value={(settings.telegramAllowList || []).join("\n")} onChange={(e) => setSettings({ ...settings, telegramAllowList: e.target.value.split("\n").filter(Boolean) })} placeholder="每行一个 User ID" />
          </Field>
        )}
        <Field>
          <FieldLabel>Mini App URL</FieldLabel>
          <Input value={settings.miniAppUrl} onChange={(e) => setSettings({ ...settings, miniAppUrl: e.target.value })} placeholder="https://..." />
        </Field>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>全局邮件推送</FieldLabel>
            <Switch checked={settings.enableGlobalMailPush} onCheckedChange={(v) => setSettings({ ...settings, enableGlobalMailPush: v })} />
          </div>
          <FieldDescription>启用后所有邮件都会推送到绑定的 Telegram 用户</FieldDescription>
        </Field>
      </FieldGroup>
      <div className="flex gap-2">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>保存设置</Button>
        <Button variant="outline" onClick={() => initMutation.mutate()} disabled={initMutation.isPending}>
          <Zap className="size-3.5" /> 初始化 Webhook
        </Button>
      </div>

      {status && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm">Bot 状态</CardTitle>
            <Button variant="ghost" size="icon-xs" onClick={() => refetchStatus()}><RefreshCw className="size-3.5" /></Button>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto text-xs text-muted-foreground">{JSON.stringify(status, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
