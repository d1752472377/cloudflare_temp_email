"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import type { UserSettings } from "@/lib/types"

export function UserSettingsPanel() {
  const [settings, setSettings] = useState<UserSettings | null>(null)

  const { isLoading } = useQuery({
    queryKey: ["user_settings"],
    queryFn: async () => {
      const { data } = await api.get<UserSettings>("/admin/user_settings")
      setSettings(data)
      return data
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => api.post("/admin/user_settings", settings),
    onSuccess: () => toast.success("设置已保存"),
    onError: () => toast.error("保存失败"),
  })

  if (isLoading || !settings) return <Skeleton className="h-48 w-full" />

  const update = (patch: Partial<UserSettings>) => setSettings({ ...settings!, ...patch })

  return (
    <div className="flex flex-col gap-4">
      <FieldGroup>
        <Field><div className="flex items-center justify-between"><FieldLabel>允许用户注册</FieldLabel><Switch checked={settings.enableUserRegister} onCheckedChange={(v) => update({ enableUserRegister: v })} /></div></Field>
        <Field><div className="flex items-center justify-between"><FieldLabel>允许用户创建邮箱</FieldLabel><Switch checked={settings.enableUserCreateEmail} onCheckedChange={(v) => update({ enableUserCreateEmail: v })} /></div></Field>
        <Field><div className="flex items-center justify-between"><FieldLabel>允许修改密码</FieldLabel><Switch checked={settings.enableUserChangePassword} onCheckedChange={(v) => update({ enableUserChangePassword: v })} /></div></Field>
        <Field><div className="flex items-center justify-between"><FieldLabel>启用邮箱验证</FieldLabel><Switch checked={settings.enableMailVerify} onCheckedChange={(v) => update({ enableMailVerify: v })} /></div></Field>
      </FieldGroup>
      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>保存设置</Button>
    </div>
  )
}
