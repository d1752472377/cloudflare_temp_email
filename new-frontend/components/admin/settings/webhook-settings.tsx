"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { AdminWebhookSettings, WebhookSettings } from "@/lib/types"

export function WebhookSettingsPanel() {
  const [adminWebhook, setAdminWebhook] = useState<AdminWebhookSettings | null>(null)
  const [mailWebhook, setMailWebhook] = useState<WebhookSettings | null>(null)

  const { isLoading } = useQuery({
    queryKey: ["webhook_settings"],
    queryFn: async () => {
      const [w, mw] = await Promise.all([
        api.get<AdminWebhookSettings>("/admin/webhook/settings"),
        api.get<WebhookSettings>("/admin/mail_webhook/settings"),
      ])
      setAdminWebhook(w.data)
      setMailWebhook(mw.data)
      return { adminWebhook: w.data, mailWebhook: mw.data }
    },
  })

  const saveWebhook = useMutation({
    mutationFn: () => api.post("/admin/webhook/settings", adminWebhook),
    onSuccess: () => toast.success("Webhook 设置已保存"),
    onError: () => toast.error("保存失败"),
  })

  const saveMailWebhook = useMutation({
    mutationFn: () => api.post("/admin/mail_webhook/settings", mailWebhook),
    onSuccess: () => toast.success("邮件 Webhook 设置已保存"),
    onError: () => toast.error("保存失败"),
  })

  const testMailWebhook = useMutation({
    mutationFn: () => api.post("/admin/mail_webhook/test", mailWebhook),
    onSuccess: () => toast.success("测试邮件已发送"),
    onError: () => toast.error("测试失败"),
  })

  if (isLoading || !adminWebhook || !mailWebhook) return <Skeleton className="h-48 w-full" />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-sm font-medium">Webhook 允许列表</h3>
        <FieldGroup>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>启用 Webhook 允许列表</FieldLabel>
              <Switch checked={adminWebhook.enableAllowList} onCheckedChange={(v) => setAdminWebhook({ ...adminWebhook, enableAllowList: v })} />
            </div>
          </Field>
          <Field>
            <FieldLabel>允许列表（每行一个地址）</FieldLabel>
            <textarea className="min-h-[100px] w-full rounded-md border border-border bg-background p-2 text-sm" value={(adminWebhook.allowList || []).join("\n")} onChange={(e) => setAdminWebhook({ ...adminWebhook, allowList: e.target.value.split("\n").filter(Boolean) })} placeholder="每行一个邮箱地址" />
          </Field>
          <Button size="sm" onClick={() => saveWebhook.mutate()} disabled={saveWebhook.isPending}>保存</Button>
        </FieldGroup>
      </div>

      <Separator />

      <div>
        <h3 className="mb-3 text-sm font-medium">全局邮件 Webhook</h3>
        <FieldGroup>
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel>启用邮件 Webhook</FieldLabel>
              <Switch checked={mailWebhook.enabled} onCheckedChange={(v) => setMailWebhook({ ...mailWebhook, enabled: v })} />
            </div>
          </Field>
          <Field>
            <FieldLabel>Webhook URL</FieldLabel>
            <Input value={mailWebhook.url} onChange={(e) => setMailWebhook({ ...mailWebhook, url: e.target.value })} placeholder="https://..." />
          </Field>
          <Field>
            <FieldLabel>请求方法</FieldLabel>
            <select className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm" value={mailWebhook.method} onChange={(e) => setMailWebhook({ ...mailWebhook, method: e.target.value })}>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
            </select>
          </Field>
          <Field>
            <FieldLabel>Headers (JSON)</FieldLabel>
            <textarea className="min-h-[60px] w-full rounded-md border border-border bg-background p-2 text-sm font-mono" value={mailWebhook.headers} onChange={(e) => setMailWebhook({ ...mailWebhook, headers: e.target.value })} placeholder='{"Content-Type":"application/json"}' />
          </Field>
          <Field>
            <FieldLabel>Body 模板 (JSON)</FieldLabel>
            <textarea className="min-h-[100px] w-full rounded-md border border-border bg-background p-2 text-sm font-mono" value={mailWebhook.body} onChange={(e) => setMailWebhook({ ...mailWebhook, body: e.target.value })} placeholder='{"id":"${id}","from":"${from}","subject":"${subject}"}' />
          </Field>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => saveMailWebhook.mutate()} disabled={saveMailWebhook.isPending}>保存</Button>
            <Button size="sm" variant="outline" onClick={() => testMailWebhook.mutate()} disabled={testMailWebhook.isPending}>发送测试</Button>
          </div>
        </FieldGroup>
      </div>
    </div>
  )
}
