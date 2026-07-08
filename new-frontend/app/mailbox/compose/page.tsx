"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ChevronDown,
  ChevronRight,
  Save,
  Send,
  TriangleAlert,
} from "lucide-react"

import api from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Separator } from "@/components/ui/separator"

export default function ComposePage() {
  const [to, setTo] = useState("")
  const [showCc, setShowCc] = useState(false)
  const [cc, setCc] = useState("")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [fromName, setFromName] = useState("")
  const [saved, setSaved] = useState(false)

  const { data: settings } = useQuery({
    queryKey: ["mailbox_settings"],
    queryFn: async () => {
      const { data } = await api.get<{ address: string; send_balance: number }>("/api/settings")
      return data
    },
  })

  const sendMutation = useMutation({
    mutationFn: () =>
      api.post("/api/send_mail", {
        from_name: fromName || settings?.address || "",
        to_mail: to,
        cc_mail: cc || undefined,
        subject,
        content,
      }),
    onSuccess: () => {
      toast.success("邮件已发送")
      setTo(""); setCc(""); setSubject(""); setContent("")
    },
    onError: () => toast.error("发送失败"),
  })

  const requestAccessMutation = useMutation({
    mutationFn: () => api.post("/api/request_send_mail_access"),
    onSuccess: () => toast.success("已提交发信权限申请"),
    onError: () => toast.error("申请失败"),
  })

  const handleSaveDraft = () => {
    try {
      localStorage.setItem("compose_draft", JSON.stringify({ to, cc, subject, content }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      toast.success("草稿已保存")
    } catch {
      toast.error("保存草稿失败")
    }
  }

  const handleLoadDraft = () => {
    try {
      const raw = localStorage.getItem("compose_draft")
      if (raw) {
        const draft = JSON.parse(raw)
        if (draft.to) setTo(draft.to)
        if (draft.cc) { setCc(draft.cc); setShowCc(true) }
        if (draft.subject) setSubject(draft.subject)
        if (draft.content) setContent(draft.content)
        toast.success("草稿已载入")
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-muted/20">
      {settings && settings.send_balance <= 0 && (
        <div className="bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <div className="mx-auto flex max-w-3xl items-center gap-2">
            <TriangleAlert className="size-4 shrink-0" />
            <span className="flex-1">当前邮箱暂无发信权限</span>
            <Button variant="outline" size="sm" className="h-7 border-amber-300 text-xs" onClick={() => requestAccessMutation.mutate()}>
              申请权限
            </Button>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-5 sm:px-6 lg:py-6">
          {/* Draft controls */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={!to && !subject}>
              <Save className="mr-1.5 size-3.5" />
              保存草稿
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLoadDraft}>
              载入草稿
            </Button>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="compose-from">发件人</FieldLabel>
              <Input id="compose-from" value={settings?.address || ""} readOnly aria-label="发件人" />
            </Field>
            <Field>
              <FieldLabel htmlFor="compose-to">收件人</FieldLabel>
              <Input id="compose-to" placeholder="name@example.com" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>

            {/* CC field (collapsible) */}
            {showCc ? (
              <Field>
                <FieldLabel htmlFor="compose-cc">抄送</FieldLabel>
                <div className="flex items-center gap-2">
                  <Input id="compose-cc" placeholder="cc@example.com" value={cc} onChange={(e) => setCc(e.target.value)} className="flex-1" />
                  <button type="button" onClick={() => { setShowCc(false); setCc("") }} className="text-xs text-muted-foreground hover:text-foreground">
                    隐藏
                  </button>
                </div>
              </Field>
            ) : (
              <button type="button" onClick={() => setShowCc(true)} className="-mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <ChevronRight className="size-3" />
                添加抄送
              </button>
            )}

            <Field>
              <FieldLabel htmlFor="compose-subject">主题</FieldLabel>
              <Input id="compose-subject" placeholder="邮件主题" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </Field>

            <Field>
              <FieldLabel htmlFor="compose-body">正文</FieldLabel>
              <Textarea
                id="compose-body"
                placeholder="在此输入邮件内容…"
                className="min-h-48 resize-y"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </Field>
          </FieldGroup>

          <Separator />

          {/* Send button */}
          <div className="flex items-center gap-3">
            <Button
              size="default"
              onClick={() => sendMutation.mutate()}
              disabled={!to || !subject || sendMutation.isPending}
            >
              <Send className="mr-2 size-4" />
              {sendMutation.isPending ? "发送中..." : "发送"}
            </Button>
            {settings && (
              <span className="text-xs text-muted-foreground">
                剩余额度: {settings.send_balance}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
