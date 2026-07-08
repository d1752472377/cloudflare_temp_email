"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { AccountSettings } from "@/lib/types"

export function SiteSettings() {
  const [settings, setSettings] = useState<AccountSettings | null>(null)

  const { isLoading } = useQuery({
    queryKey: ["account_settings"],
    queryFn: async () => {
      const { data } = await api.get<AccountSettings>("/admin/account_settings")
      setSettings(data)
      return data
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => api.post("/admin/account_settings", settings),
    onSuccess: () => toast.success("设置已保存"),
    onError: () => toast.error("保存失败"),
  })

  if (isLoading || !settings) return <Skeleton className="h-64 w-full" />

  const update = (patch: Partial<AccountSettings>) => setSettings({ ...settings!, ...patch })

  const renderList = (label: string, value: string[], onChange: (v: string[]) => void) => (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Textarea value={(value || []).join("\n")} onChange={(e) => onChange(e.target.value.split("\n").filter(Boolean))} rows={4} placeholder="每行一条" />
      <FieldDescription>每行一条</FieldDescription>
    </Field>
  )

  return (
    <div className="flex flex-col gap-4">
      <FieldGroup>
        <Field>
          <div className="flex items-center justify-between"><FieldLabel>屏蔽地址创建</FieldLabel><Switch checked={settings.enableBlockAddress} onCheckedChange={(v) => update({ enableBlockAddress: v })} /></div>
        </Field>
        {settings.enableBlockAddress && renderList("地址屏蔽列表", settings.blockAddressList, (v) => update({ blockAddressList: v }))}

        <Separator />

        <Field>
          <div className="flex items-center justify-between"><FieldLabel>屏蔽发件</FieldLabel><Switch checked={settings.enableBlockSend} onCheckedChange={(v) => update({ enableBlockSend: v })} /></div>
        </Field>
        {settings.enableBlockSend && renderList("发件屏蔽列表", settings.blockSendList, (v) => update({ blockSendList: v }))}

        <Separator />

        <Field>
          <div className="flex items-center justify-between"><FieldLabel>启用地址创建</FieldLabel><Switch checked={settings.enableAddressCreation} onCheckedChange={(v) => update({ enableAddressCreation: v })} /></div>
        </Field>
        <Field>
          <div className="flex items-center justify-between"><FieldLabel>启用前缀</FieldLabel><Switch checked={settings.enablePrefix} onCheckedChange={(v) => update({ enablePrefix: v })} /></div>
        </Field>
        <Field>
          <div className="flex items-center justify-between"><FieldLabel>启用随机子域名</FieldLabel><Switch checked={settings.enableRandomSubdomain} onCheckedChange={(v) => update({ enableRandomSubdomain: v })} /></div>
        </Field>
        <Field>
          <FieldLabel>最大地址数</FieldLabel>
          <Input type="number" value={settings.maxAddressCount} onChange={(e) => update({ maxAddressCount: Number(e.target.value) })} className="max-w-xs" />
        </Field>
      </FieldGroup>
      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>保存设置</Button>
    </div>
  )
}
