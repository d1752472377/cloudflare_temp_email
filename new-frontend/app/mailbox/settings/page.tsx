"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AlertTriangle, Link2, Send } from "lucide-react"

import api from "@/lib/api"
import { hashPassword } from "@/lib/crypto"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// ---- Tab: 自动回复 ----
function AutoReplyTab() {
  const queryClient = useQueryClient()
  const [enabled, setEnabled] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [name, setName] = useState("")
  const [sourcePrefix, setSourcePrefix] = useState("")

  const { isLoading } = useQuery({
    queryKey: ["auto_reply"],
    queryFn: async () => {
      const { data } = await api.get("/api/auto_reply")
      const ar = (data as Record<string, unknown>).auto_reply as Record<string, unknown> | undefined
      if (ar) {
        setEnabled(!!ar.enabled)
        setSubject(String(ar.subject || ""))
        setMessage(String(ar.message || ""))
        setName(String(ar.name || ""))
        setSourcePrefix(String(ar.source_prefix || ""))
      }
      return data
    },
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      api.post("/api/auto_reply", {
        auto_reply: { enabled, subject, message, name, source_prefix: sourcePrefix },
      }),
    onSuccess: () => { toast.success("自动回复已保存"); queryClient.invalidateQueries({ queryKey: ["auto_reply"] }) },
    onError: () => toast.error("保存失败"),
  })

  if (isLoading) return <Skeleton className="h-64 w-full rounded-lg" />

  return (
    <Card>
      <CardHeader>
        <CardTitle>自动回复</CardTitle>
        <CardDescription>开启后，收到新邮件时将自动回复设定的内容。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <Field orientation="horizontal">
          <FieldLabel htmlFor="ar-toggle">启用自动回复</FieldLabel>
          <Switch id="ar-toggle" checked={enabled} onCheckedChange={setEnabled} />
        </Field>
        <Separator />
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="ar-name">回复者签名</FieldLabel>
            <Input id="ar-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如: 自动回复助手" />
            <FieldDescription>回复邮件时显示的发件人名称</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="ar-source-prefix">来源前缀过滤</FieldLabel>
            <Input id="ar-source-prefix" value={sourcePrefix} onChange={(e) => setSourcePrefix(e.target.value)} placeholder="留空则回复所有邮件" />
            <FieldDescription>仅对发件人地址以此前缀开头的邮件自动回复</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="ar-subject">回复主题</FieldLabel>
            <Input id="ar-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="ar-body">回复内容</FieldLabel>
            <Textarea id="ar-body" className="min-h-32" value={message} onChange={(e) => setMessage(e.target.value)} />
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>保存设置</Button>
      </CardFooter>
    </Card>
  )
}

// ---- Tab: Webhook ----
function WebhookTab() {
  const queryClient = useQueryClient()
  const [enabled, setEnabled] = useState(false)
  const [url, setUrl] = useState("")
  const [method, setMethod] = useState("POST")
  const [headers, setHeaders] = useState('{"Content-Type":"application/json"}')
  const [body, setBody] = useState('{"id":"${id}","from":"${from}","subject":"${subject}","parsedText":"${parsedText}"}')

  const { isLoading } = useQuery({
    queryKey: ["webhook_settings"],
    queryFn: async () => {
      const { data } = await api.get<{ enabled: boolean; url: string; method: string; headers: string; body: string }>("/api/webhook/settings")
      setEnabled(!!data.enabled)
      setUrl(data.url || "")
      setMethod(data.method || "POST")
      setHeaders(data.headers || '{"Content-Type":"application/json"}')
      setBody(data.body || "")
      return data
    },
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      api.post("/api/webhook/settings", {
        enabled, url, method, headers, body,
      }),
    onSuccess: () => { toast.success("Webhook 已保存"); queryClient.invalidateQueries({ queryKey: ["webhook_settings"] }) },
    onError: () => toast.error("保存失败"),
  })

  const testMutation = useMutation({
    mutationFn: () => api.post("/api/webhook/test", { enabled, url, method, headers, body }),
    onSuccess: () => toast.success("测试 Webhook 已触发"),
    onError: () => toast.error("测试失败"),
  })

  if (isLoading) return <Skeleton className="h-64 w-full rounded-lg" />

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook 设置</CardTitle>
        <CardDescription>收到新邮件时，系统会向此地址发送 POST 通知。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <Field orientation="horizontal">
          <FieldLabel htmlFor="wh-toggle">启用 Webhook</FieldLabel>
          <Switch id="wh-toggle" checked={enabled} onCheckedChange={setEnabled} />
        </Field>
        <Separator />
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="wh-url">回调地址</FieldLabel>
            <Input id="wh-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            <FieldDescription>需返回 2xx 状态码视为成功。</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="wh-method">请求方法</FieldLabel>
            <select id="wh-method" className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
            </select>
          </Field>
          <Field>
            <FieldLabel htmlFor="wh-headers">Headers (JSON)</FieldLabel>
            <textarea id="wh-headers" className="min-h-[60px] w-full rounded-md border border-border bg-background p-2 text-sm font-mono" value={headers} onChange={(e) => setHeaders(e.target.value)} placeholder='{"Content-Type":"application/json"}' />
          </Field>
          <Field>
            <FieldLabel htmlFor="wh-body">Body 模板 (JSON)</FieldLabel>
            <textarea id="wh-body" className="min-h-[100px] w-full rounded-md border border-border bg-background p-2 text-sm font-mono" value={body} onChange={(e) => setBody(e.target.value)} placeholder='{"subject":"${subject}","from":"${from}"}' />
            <FieldDescription>支持 {'${id}'}, {'${from}'}, {'${to}'}, {'${subject}'}, {'${parsedText}'}, {'${parsedHtml}'} 等模板变量</FieldDescription>
          </Field>
        </FieldGroup>
      </CardContent>
      <CardFooter className="gap-2">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>保存设置</Button>
        <Button variant="outline" onClick={() => testMutation.mutate()} disabled={testMutation.isPending}>
          <Send data-icon="inline-start" />
          发送测试
        </Button>
      </CardFooter>
    </Card>
  )
}

// ---- Tab: 账户 ----
function AccountTab() {
  const queryClient = useQueryClient()
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [dangerAction, setDangerAction] = useState<string | null>(null)

  const { data: settings } = useQuery({
    queryKey: ["mailbox_settings"],
    queryFn: async () => {
      const { data } = await api.get<{ address: string }>("/api/settings")
      return data
    },
  })

  const changePwMutation = useMutation({
    mutationFn: async () => {
      const hashed = await hashPassword(newPw)
      return api.post("/api/address_change_password", { new_password: hashed })
    },
    onSuccess: () => { toast.success("密码已更新"); setNewPw(""); setConfirmPw("") },
    onError: () => toast.error("密码修改失败"),
  })

  const bindMutation = useMutation({
    mutationFn: () => api.post("/user_api/bind_address"),
    onSuccess: () => toast.success("已绑定到账号"),
    onError: () => toast.error("绑定失败（请先登录账号）"),
  })

  const dangerMutations: Record<string, { label: string; action: () => void }> = {
    clearInbox: {
      label: "清空收件箱",
      action: () => {
        api.delete("/api/clear_inbox").then(() => {
          toast.success("收件箱已清空")
          setDangerAction(null)
        }).catch(() => toast.error("操作失败"))
      },
    },
    clearSent: {
      label: "清空已发送",
      action: () => {
        api.delete("/api/clear_sent_items").then(() => {
          toast.success("已发送已清空")
          setDangerAction(null)
        }).catch(() => toast.error("操作失败"))
      },
    },
    deleteAddress: {
      label: "删除此邮箱",
      action: () => {
        api.delete("/api/delete_address").then(() => {
          toast.success("邮箱已删除")
          setDangerAction(null)
          window.location.href = "/"
        }).catch(() => toast.error("操作失败"))
      },
    },
  }

  const handleChangePw = () => {
    if (!newPw) { toast.error("请输入新密码"); return }
    if (newPw !== confirmPw) { toast.error("两次密码不一致"); return }
    changePwMutation.mutate()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 修改密码 */}
      <Card>
        <CardHeader>
          <CardTitle>修改密码</CardTitle>
          <CardDescription>{settings?.address || ""}</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-pw">新密码</FieldLabel>
              <Input id="new-pw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-pw">确认新密码</FieldLabel>
              <Input id="confirm-pw" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleChangePw()} />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button onClick={handleChangePw} disabled={!newPw || changePwMutation.isPending}>更新密码</Button>
        </CardFooter>
      </Card>

      {/* 绑定到账号 */}
      <Card>
        <CardHeader>
          <CardTitle>绑定到账号</CardTitle>
          <CardDescription>将此匿名邮箱绑定到你的注册账号，升级为长期邮箱。</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" onClick={() => bindMutation.mutate()} disabled={bindMutation.isPending}>
            <Link2 data-icon="inline-start" />
            绑定到账号
          </Button>
        </CardFooter>
      </Card>

      {/* 危险操作 */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-4" />
            危险操作
          </CardTitle>
          <CardDescription>以下操作不可撤销，执行前会要求二次确认。</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {["clearInbox", "clearSent", "deleteAddress"].map((key) => {
            const item = dangerMutations[key]
            return (
              <div key={key} className="flex items-center justify-between rounded-md border border-border px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => setDangerAction(key)}>{item.label}</Button>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <AlertDialog open={dangerAction !== null} onOpenChange={() => setDangerAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">确认{dangerAction ? dangerMutations[dangerAction]?.label : ""}</AlertDialogTitle>
            <AlertDialogDescription>此操作不可撤销，确定要继续吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => dangerAction && dangerMutations[dangerAction]?.action()}>
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function MailboxSettingsPage() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-muted/20">
      <header className="sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b border-border/70 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
        <h1 className="text-sm font-semibold">邮箱设置</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-5 sm:px-6 lg:py-6">
          <Tabs defaultValue="auto-reply">
            <TabsList>
              <TabsTrigger value="auto-reply">自动回复</TabsTrigger>
              <TabsTrigger value="webhook">Webhook</TabsTrigger>
              <TabsTrigger value="account">账户</TabsTrigger>
            </TabsList>
            <TabsContent value="auto-reply" className="mt-4"><AutoReplyTab /></TabsContent>
            <TabsContent value="webhook" className="mt-4"><WebhookTab /></TabsContent>
            <TabsContent value="account" className="mt-4"><AccountTab /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
