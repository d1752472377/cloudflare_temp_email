"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import api from "@/lib/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

export function QuickSetup() {
  const { data: settings } = useQuery({
    queryKey: ["admin_quick_setup", "settings"],
    queryFn: async () => {
      const { data } = await api.get<Record<string, unknown>>("/admin/user_settings")
      return data
    },
  })

  const saveMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post("/admin/user_settings", body),
    onSuccess: () => { toast.success("保存成功") },
    onError: () => toast.error("保存失败"),
  })

  const [enableRegister, setEnableRegister] = useState(false)
  const [enableMailVerify, setEnableMailVerify] = useState(false)

  const handleSave = () => {
    saveMutation.mutate({
      enable_register: enableRegister,
      enable_mail_verify: enableMailVerify,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">快速设置</CardTitle>
        <CardDescription>一站式配置常用系统参数</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <Field orientation="horizontal">
          <FieldLabel htmlFor="qs-register">允许用户注册</FieldLabel>
          <Switch id="qs-register" checked={enableRegister} onCheckedChange={setEnableRegister} />
        </Field>
        <Separator />
        <Field orientation="horizontal">
          <FieldLabel htmlFor="qs-mail-verify">启用邮件验证</FieldLabel>
          <Switch id="qs-mail-verify" checked={enableMailVerify} onCheckedChange={setEnableMailVerify} />
        </Field>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>保存设置</Button>
      </CardFooter>
    </Card>
  )
}
