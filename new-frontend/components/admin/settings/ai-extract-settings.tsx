"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"

import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { AiExtractSettings } from "@/lib/types"

export function AiExtractSettings() {
  const [settings, setSettings] = useState<AiExtractSettings | null>(null)

  const { isLoading } = useQuery({
    queryKey: ["ai_extract_settings"],
    queryFn: async () => {
      const { data } = await api.get<AiExtractSettings>("/admin/ai_extract/settings")
      setSettings(data)
      return data
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => api.post("/admin/ai_extract/settings", settings),
    onSuccess: () => toast.success("设置已保存"),
    onError: () => toast.error("保存失败"),
  })

  if (isLoading || !settings) return <Skeleton className="h-48 w-full" />

  const update = (patch: Partial<AiExtractSettings>) => setSettings({ ...settings!, ...patch })

  return (
    <div className="flex flex-col gap-4">
      <FieldGroup>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>启用 AI 提取</FieldLabel>
            <Switch checked={settings.enabled} onCheckedChange={(v) => update({ enabled: v })} />
          </div>
        </Field>
        {settings.enabled && (
          <>
            <Field>
              <FieldLabel>模型</FieldLabel>
              <Input value={settings.model || ""} onChange={(e) => update({ model: e.target.value })} placeholder="例如: @cf/meta/llama-3.1-8b-instruct" />
            </Field>
            <Field>
              <FieldLabel>允许列表</FieldLabel>
              <div className="flex flex-wrap gap-1">
                {settings.allowList.map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs">
                    {item}
                    <button onClick={() => update({ allowList: settings.allowList.filter((_, idx) => idx !== i) })} className="text-muted-foreground hover:text-destructive">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                <Input placeholder="添加地址..." id="ai-allow-input" />
                <Button variant="outline" size="sm" onClick={() => {
                  const input = document.getElementById("ai-allow-input") as HTMLInputElement
                  if (input?.value) { update({ allowList: [...settings.allowList, input.value] }); input.value = "" }
                }}><Plus className="size-3.5" /></Button>
              </div>
            </Field>
          </>
        )}
      </FieldGroup>
      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>保存设置</Button>
    </div>
  )
}
