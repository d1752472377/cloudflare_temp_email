"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import type { IpBlacklistSettings } from "@/lib/types"

export function IpBlacklistSettings() {
  const [settings, setSettings] = useState<IpBlacklistSettings | null>(null)

  const { isLoading } = useQuery({
    queryKey: ["ip_blacklist_settings"],
    queryFn: async () => {
      const { data } = await api.get<IpBlacklistSettings>("/admin/ip_blacklist/settings")
      setSettings(data)
      return data
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => api.post("/admin/ip_blacklist/settings", settings),
    onSuccess: () => toast.success("设置已保存"),
    onError: () => toast.error("保存失败"),
  })

  if (isLoading || !settings) return <Skeleton className="h-64 w-full" />

  const update = (patch: Partial<IpBlacklistSettings>) => setSettings({ ...settings!, ...patch })

  return (
    <div className="flex flex-col gap-4">
      <FieldGroup>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>启用 IP 黑名单</FieldLabel>
            <Switch checked={settings.enableIpBlacklist} onCheckedChange={(v) => update({ enableIpBlacklist: v })} />
          </div>
        </Field>
        {settings.enableIpBlacklist && (
          <Field>
            <FieldLabel>IP 黑名单</FieldLabel>
            <Textarea value={(settings.ipBlacklist || []).join("\n")} onChange={(e) => update({ ipBlacklist: e.target.value.split("\n").filter(Boolean) })} rows={4} placeholder="每行一个 IP" />
            <FieldDescription>每行一个 IP 地址</FieldDescription>
          </Field>
        )}

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>启用 ASN 黑名单</FieldLabel>
            <Switch checked={settings.enableAsnBlacklist} onCheckedChange={(v) => update({ enableAsnBlacklist: v })} />
          </div>
        </Field>
        {settings.enableAsnBlacklist && (
          <Field>
            <FieldLabel>ASN 黑名单</FieldLabel>
            <Textarea value={(settings.asnBlacklist || []).join("\n")} onChange={(e) => update({ asnBlacklist: e.target.value.split("\n").filter(Boolean) })} rows={3} placeholder="每行一个 ASN" />
          </Field>
        )}

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>启用浏览器指纹黑名单</FieldLabel>
            <Switch checked={settings.enableFingerprintBlacklist} onCheckedChange={(v) => update({ enableFingerprintBlacklist: v })} />
          </div>
        </Field>
        {settings.enableFingerprintBlacklist && (
          <Field>
            <FieldLabel>指纹黑名单</FieldLabel>
            <Textarea value={(settings.fingerprintBlacklist || []).join("\n")} onChange={(e) => update({ fingerprintBlacklist: e.target.value.split("\n").filter(Boolean) })} rows={3} placeholder="每行一个指纹" />
          </Field>
        )}

        <Field>
          <FieldLabel>IP 白名单</FieldLabel>
          <Textarea value={(settings.ipWhitelist || []).join("\n")} onChange={(e) => update({ ipWhitelist: e.target.value.split("\n").filter(Boolean) })} rows={3} placeholder="每行一个 IP" />
        </Field>

        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>启用每日请求限制</FieldLabel>
            <Switch checked={settings.enableDailyRequestLimit} onCheckedChange={(v) => update({ enableDailyRequestLimit: v })} />
          </div>
        </Field>
        {settings.enableDailyRequestLimit && (
          <Field>
            <FieldLabel>每日请求限制</FieldLabel>
            <input type="number" className="h-8 w-full max-w-xs rounded-md border border-border bg-background px-2 text-sm" value={settings.dailyRequestLimit} onChange={(e) => update({ dailyRequestLimit: Number(e.target.value) })} />
          </Field>
        )}
      </FieldGroup>
      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>保存设置</Button>
    </div>
  )
}
