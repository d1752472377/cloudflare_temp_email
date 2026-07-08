"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"

export function AppearanceSettings() {
  const [autoRefreshInterval, setAutoRefreshInterval] = useState("30")
  const [useSideMargin, setUseSideMargin] = useState(true)
  const [useIframe, setUseIframe] = useState(false)
  const [preferText, setPreferText] = useState(false)

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("autoRefreshInterval", autoRefreshInterval)
      localStorage.setItem("useSideMargin", String(useSideMargin))
      localStorage.setItem("useIframe", String(useIframe))
      localStorage.setItem("preferText", String(preferText))
    }
    toast.success("外观设置已保存")
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">界面显示</CardTitle>
          <CardDescription>自定义邮件客户端的显示方式</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Field orientation="horizontal">
            <FieldLabel htmlFor="app-auto-refresh">自动刷新间隔(秒)</FieldLabel>
            <Input
              id="app-auto-refresh"
              type="number"
              className="w-24"
              value={autoRefreshInterval}
              onChange={(e) => setAutoRefreshInterval(e.target.value)}
            />
          </Field>
          <Separator />
          <Field orientation="horizontal">
            <FieldLabel htmlFor="app-side-margin">开启页面左右侧边距</FieldLabel>
            <Switch id="app-side-margin" checked={useSideMargin} onCheckedChange={setUseSideMargin} />
          </Field>
          <Separator />
          <Field orientation="horizontal">
            <FieldLabel htmlFor="app-iframe">使用 iframe 显示 HTML 邮件</FieldLabel>
            <Switch id="app-iframe" checked={useIframe} onCheckedChange={setUseIframe} />
          </Field>
          <Separator />
          <Field orientation="horizontal">
            <FieldLabel htmlFor="app-prefer-text">默认以文本显示邮件</FieldLabel>
            <Switch id="app-prefer-text" checked={preferText} onCheckedChange={setPreferText} />
          </Field>
        </CardContent>
      </Card>
      <div>
        <Button onClick={handleSave}>保存外观设置</Button>
      </div>
    </div>
  )
}
