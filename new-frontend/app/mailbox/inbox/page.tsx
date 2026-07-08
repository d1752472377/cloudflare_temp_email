"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Archive,
  Copy,
  Download,
  FileText,
  Forward,
  Maximize,
  Minimize,
  Paperclip,
  Reply,
  Trash2,
} from "lucide-react"

import api from "@/lib/api"
import { useMailboxSearch } from "@/contexts/mailbox-search-context"
import { useOpenSettings } from "@/contexts/open-settings-context"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { DataTablePagination } from "@/components/shared/data-table-pagination"
import { extractVerificationCodes } from "@/lib/verification-code"
import type { PaginatedResponse } from "@/lib/types"

type ParsedMail = {
  id: number
  message_id: string
  raw?: string
  source: string
  address: string
  sender: string
  subject: string
  text: string
  html: string
  attachments: { filename: string; mimeType: string; disposition: string; size: number }[]
  metadata: string
  created_at: string
}

/** 包装邮件 HTML */
function wrapMailHtml(html: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base target="_blank">
<style>
  * { box-sizing: border-box; }
  body { 
    margin: 0; padding: 16px; 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
    font-size: 14px; line-height: 1.6; color: #333; 
    word-break: break-word; 
  }
  img { max-width: 100%; height: auto; }
  a { color: #2563eb; }
  table { border-collapse: collapse; max-width: 100%; }
  pre { white-space: pre-wrap; word-break: break-all; }
  /* 暗色模式适配 */
  @media (prefers-color-scheme: dark) {
    body { color: #e5e7eb; background: #1a1a1a; }
    a { color: #60a5fa; }
  }
</style>
</head>
<body>${html}</body>
</html>`
}

/** 邮件 iframe 自适应高度组件 */
function MailIframe({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(400)

  const srcDoc = useMemo(() => wrapMailHtml(html), [html])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const onLoad = () => {
      try {
        const body = iframe.contentDocument?.body
        if (body) {
          setHeight(body.scrollHeight + 32)
        }
      } catch {
        // cross-origin fallback, keep default height
      }
    }

    iframe.addEventListener("load", onLoad)
    return () => iframe.removeEventListener("load", onLoad)
  }, [srcDoc])

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      style={{ height }}
      className="w-full rounded border-0"
      title="邮件内容"
      sandbox="allow-same-origin allow-popups allow-scripts allow-top-navigation-by-user-activation"
    />
  )
}

/** Download a single mail as .eml */
async function downloadEml(mailId: number, filename: string) {
  try {
    const { data } = await api.get<{ raw?: string }>(`/api/mail/${mailId}`)
    if (!data?.raw) {
      toast.error("无法获取原始邮件")
      return
    }
    const blob = new Blob([data.raw], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename || "mail"}.eml`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    toast.error("下载失败")
  }
}

/** Batch download selected mails as .eml zip */
async function batchDownloadEml(mails: ParsedMail[]) {
  const JSZip = (await import("jszip")).default
  const zip = new JSZip()
  let successCount = 0

  for (const mail of mails) {
    try {
      const { data } = await api.get<{ raw?: string }>(`/api/mail/${mail.id}`)
      if (data?.raw) {
        zip.file(`${mail.id}.eml`, data.raw)
        successCount++
      }
    } catch {
      // skip failed
    }
  }

  if (successCount === 0) {
    toast.error("无法下载任何邮件")
    return
  }

  const blob = await zip.generateAsync({ type: "blob" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `mails_${Date.now()}.zip`
  a.click()
  URL.revokeObjectURL(url)
  toast.success(`已下载 ${successCount} 封邮件`)
}

function VerificationCodeCard({ text }: { text: string }) {
  const codes = useMemo(() => extractVerificationCodes(text), [text])
  if (codes.length === 0) return null

  return (
    <Card className="border-amber-400/50 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-950/20">
      <CardContent className="flex flex-col gap-3 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">验证码</span>
          <span className="text-xs text-amber-600/70 dark:text-amber-400/70">
            检测到以下验证码，点击即可复制
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {codes.map(({ code }) => (
            <Button
              key={code}
              variant="outline"
              size="lg"
              className="border-amber-300 bg-white font-mono text-base font-bold tracking-widest text-amber-800 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60"
              onClick={() => {
                navigator.clipboard.writeText(code)
                toast.success(`已复制: ${code}`)
              }}
            >
              <Copy className="mr-2 size-4" />
              {code}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AttachmentsList({ attachments }: { attachments: ParsedMail["attachments"] }) {
  if (!attachments?.length) return null

  return (
    <div className="flex flex-col gap-2">
      <Separator />
      <span className="text-xs font-medium text-muted-foreground">附件 ({attachments.length})</span>
      <div className="flex flex-wrap gap-2">
        {attachments.map((att, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
          >
            <Paperclip className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate max-w-[180px]">{att.filename || "未命名"}</span>
            {att.size > 0 && (
              <span className="text-xs text-muted-foreground">
                {(att.size / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Format date for display */
function formatTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffDays === 0) return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    if (diffDays === 1) return "昨天"
    if (diffDays < 7) return `${diffDays}天前`
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  } catch {
    return dateStr
  }
}

export default function InboxPage() {
  const queryClient = useQueryClient()
  const { searchQuery, setSearchQuery } = useMailboxSearch()
  const { settings: openSettings } = useOpenSettings()
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [showHtml, setShowHtml] = useState(true)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false)
  const pageSize = 20
  const canDelete = !!openSettings?.enableUserDeleteEmail

  const { data, isLoading } = useQuery({
    queryKey: ["inbox", page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ParsedMail>>(
        `/api/parsed_mails?limit=${pageSize}&offset=${page * pageSize}`
      )
      return data
    },
  })

  const mails = data?.results || []
  const totalCount = data?.count ?? 0

  // Filter by search query
  const filteredMails = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    if (!keyword) return mails
    return mails.filter((m) =>
      [m.sender, m.source, m.subject, m.text]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(keyword))
    )
  }, [mails, searchQuery])

  const selectedMail = filteredMails.find((m) => m.id === selectedId) || null

  // Reset selection on page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    setSelectedIds(new Set())
    setSelectedId(null)
  }, [])

  // 修复：默认展示 HTML
  const handleSelect = useCallback((id: number) => {
    setSelectedId(id)
    setShowHtml(true)
  }, [])

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredMails.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredMails.map((m) => m.id)))
    }
  }, [filteredMails, selectedIds.size])

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/mails/${id}`),
    onSuccess: () => {
      toast.success("已删除")
      queryClient.invalidateQueries({ queryKey: ["inbox"] })
      setDeleteConfirmId(null)
      if (selectedId === deleteConfirmId) setSelectedId(null)
    },
    onError: () => toast.error("删除失败"),
  })

  const batchDeleteMutation = useMutation({
    mutationFn: async () => {
      const results = await Promise.allSettled(
        Array.from(selectedIds).map((id) => api.delete(`/api/mails/${id}`))
      )
      return results
    },
    onSuccess: () => {
      toast.success(`已删除 ${selectedIds.size} 封邮件`)
      queryClient.invalidateQueries({ queryKey: ["inbox"] })
      setSelectedIds(new Set())
      setBatchDeleteOpen(false)
    },
    onError: () => toast.error("批量删除失败"),
  })

  // Fullscreen view
  if (showFullscreen && selectedMail) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <h2 className="flex-1 truncate text-sm font-semibold">{selectedMail.subject}</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowHtml(!showHtml)} title={showHtml ? "纯文本" : "HTML"}>
            <FileText className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowFullscreen(false)} title="退出全屏">
            <Minimize className="size-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="mx-auto max-w-4xl px-6 py-6">
            <VerificationCodeCard text={selectedMail.text} />
            <h1 className="mt-4 text-2xl font-semibold">{selectedMail.subject}</h1>
            <div className="mt-4 flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {(selectedMail.sender || selectedMail.source || "?").charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium">{selectedMail.sender || selectedMail.source}</div>
                <div className="text-xs text-muted-foreground">
                  {formatTime(selectedMail.created_at)}
                </div>
              </div>
            </div>
            <Separator className="my-6" />
            {showHtml && selectedMail.html ? (
              <MailIframe html={selectedMail.html} />
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {selectedMail.text || selectedMail.html?.replace(/<[^>]*>/g, "") || "(无内容)"}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Two-column layout */}
      <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-[340px_1fr]">
        {/* Left: Mail list */}
        <div className="flex min-h-0 flex-col border-r border-border/70 bg-background">
          {/* Header with batch ops */}
          <div className="flex shrink-0 items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4"
                checked={filteredMails.length > 0 && selectedIds.size === filteredMails.length}
                onChange={toggleSelectAll}
                aria-label="全选本页"
              />
              {selectedIds.size > 0 ? (
                <span className="text-xs text-muted-foreground">
                  已选 {selectedIds.size}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {totalCount} 封邮件
                </span>
              )}
            </div>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => batchDownloadEml(filteredMails.filter((m) => selectedIds.has(m.id)))}
                >
                  <Download className="mr-1 size-3.5" />
                  下载
                </Button>
                {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive"
                  onClick={() => setBatchDeleteOpen(true)}
                >
                  <Trash2 className="mr-1 size-3.5" />
                  删除
                </Button>
                )}
              </div>
            )}
          </div>
          <Separator />

          {/* Mail rows */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                加载中...
              </div>
            ) : filteredMails.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                {searchQuery ? "没有匹配的邮件" : "暂无邮件"}
              </div>
            ) : (
              <ul className="flex flex-col">
                {filteredMails.map((mail, index) => {
                  const isSelected = selectedId === mail.id
                  const isChecked = selectedIds.has(mail.id)

                  return (
                    <li key={mail.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(mail.id)}
                        className={`flex w-full items-start gap-2 border-b border-border px-3 py-2.5 text-left transition-colors hover:bg-accent ${
                          isSelected ? "bg-accent" : ""
                        }`}
                      >
                        <div className="mt-1 shrink-0" onClick={(e) => { e.stopPropagation(); toggleSelect(mail.id) }}>
                          <input type="checkbox" className="size-4" checked={isChecked} onChange={() => toggleSelect(mail.id)} aria-label={`选择邮件 ${mail.id}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm">
                              {mail.sender || mail.source || "未知发件人"}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {formatTime(mail.created_at)}
                            </span>
                          </div>
                          <div className="mt-0.5 truncate text-sm text-foreground">
                            {mail.subject || "(无主题)"}
                          </div>
                          <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {(mail.text || "").slice(0, 120)}
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Pagination */}
          <Separator />
          <div className="px-3 py-2">
            <DataTablePagination
              page={page}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={handlePageChange}
            />
          </div>
        </div>

        {/* Right: Mail detail */}
        <div className={`min-h-0 bg-background ${selectedMail ? "" : "hidden md:block"}`}>
          {selectedMail ? (
            <div className="flex h-full flex-col">
              {/* Toolbar */}
              <div className="flex items-center gap-1 border-b border-border px-3 py-2">
                <Tooltip>
                  <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label="回复" />}>
                    <Reply className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent>回复</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label="转发" />}>
                    <Forward className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent>转发</TooltipContent>
                </Tooltip>
                <Separator orientation="vertical" className="mx-1 h-5" />
                {canDelete && (
                <Tooltip>
                  <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label="删除" onClick={() => setDeleteConfirmId(selectedMail.id)} />}>
                    <Trash2 className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent>删除</TooltipContent>
                </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label="下载 .eml" onClick={() => downloadEml(selectedMail.id, selectedMail.subject || "mail")} />}>
                    <Download className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent>下载 .eml</TooltipContent>
                </Tooltip>
                <Separator orientation="vertical" className="mx-1 h-5" />
                <Tooltip>
                  <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label={showHtml ? "纯文本" : "HTML"} onClick={() => setShowHtml(!showHtml)} />}>
                    <FileText className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent>{showHtml ? "纯文本" : "HTML"}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label="全屏" onClick={() => setShowFullscreen(true)} />}>
                    <Maximize className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent>全屏</TooltipContent>
                </Tooltip>
              </div>

              {/* Content */}
              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-4 px-5 py-4">
                  <VerificationCodeCard text={selectedMail.text} />

                  <h1 className="text-xl font-semibold">{selectedMail.subject || "(无主题)"}</h1>

                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {(selectedMail.sender || selectedMail.source || "?").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{selectedMail.sender || "未知发件人"}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          &lt;{selectedMail.source}&gt;
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        收件人: {selectedMail.address} · {formatTime(selectedMail.created_at)}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {showHtml && selectedMail.html ? (
                    <MailIframe html={selectedMail.html} />
                  ) : (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {selectedMail.text || selectedMail.html?.replace(/<[^>]*>/g, "") || "(无内容)"}
                    </div>
                  )}

                  <AttachmentsList attachments={selectedMail.attachments} />
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Archive />
                  </EmptyMedia>
                  <EmptyTitle>请选择一封邮件</EmptyTitle>
                  <EmptyDescription>从左侧列表中选择邮件查看详情</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm dialog */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除此邮件吗？此操作不可撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch delete confirm */}
      <AlertDialog open={batchDeleteOpen} onOpenChange={() => setBatchDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>批量删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除选中的 {selectedIds.size} 封邮件吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => batchDeleteMutation.mutate()}
            >
              删除 {selectedIds.size} 封
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}