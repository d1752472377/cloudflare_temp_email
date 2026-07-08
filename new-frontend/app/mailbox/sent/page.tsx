"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Download, RefreshCw, Send, Trash2, Forward } from "lucide-react"

import api from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DataTablePagination } from "@/components/shared/data-table-pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { PaginatedResponse } from "@/lib/types"

type SendboxMail = {
  id: number
  address: string
  raw: string
  created_at: string
}

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

async function downloadEml(mail: SendboxMail) {
  try {
    if (!mail.raw) { toast.error("无法获取原始邮件"); return }
    const blob = new Blob([mail.raw], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sent_${mail.id}.eml`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    toast.error("下载失败")
  }
}

export default function SentPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const pageSize = 20
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["sendbox", page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<SendboxMail>>(
        `/api/sendbox?limit=${pageSize}&offset=${page * pageSize}`
      )
      return data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/sendbox/${id}`),
    onSuccess: () => {
      toast.success("已删除")
      queryClient.invalidateQueries({ queryKey: ["sendbox"] })
      setDeleteId(null)
    },
    onError: () => toast.error("删除失败"),
  })

  const mails = data?.results || []
  const selectedMail = mails.find((m) => m.id === selectedId) || null

  return (
    <div className="flex h-full flex-col overflow-hidden bg-muted/20">
      <header className="sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b border-border/70 bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
        <h1 className="text-sm font-semibold">发件箱</h1>
        <span className="ml-2 text-xs text-muted-foreground">{data?.count ?? 0} 封已发送</span>
        <div className="ml-auto">
          <Button variant="ghost" size="icon" aria-label="刷新" onClick={() => queryClient.invalidateQueries({ queryKey: ["sendbox"] })}>
            <RefreshCw />
          </Button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-[340px_1fr]">
        {/* Left: list */}
        <div className="min-h-0 overflow-y-auto border-r border-border/70 bg-background">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </div>
          ) : mails.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Send /></EmptyMedia>
                <EmptyTitle>暂无已发送邮件</EmptyTitle>
                <EmptyDescription>你还没有发送过邮件。</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="divide-y divide-border">
              {mails.map((mail) => (
                <li key={mail.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(mail.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-accent ${selectedId === mail.id ? "bg-accent" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">发送至</span>
                        <span className="truncate text-sm font-medium">{mail.address}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{formatTime(mail.created_at)}</p>
                    </div>
                    <Button
                      variant="ghost" size="icon" aria-label="删除"
                      className="shrink-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); setDeleteId(mail.id) }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: detail */}
        <div className={`min-h-0 bg-background ${selectedMail ? "" : "hidden md:flex md:items-center md:justify-center"}`}>
          {selectedMail ? (
            <div className="flex h-full flex-col">
              {/* Toolbar */}
              <div className="flex items-center gap-1 border-b border-border px-3 py-2">
                <Button variant="ghost" size="sm" onClick={() => downloadEml(selectedMail)}>
                  <Download className="mr-1.5 size-3.5" />
                  下载 .eml
                </Button>
                <div className="ml-auto">
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(selectedMail.id)} className="text-destructive">
                    <Trash2 className="mr-1.5 size-3.5" />
                    删除
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="flex flex-col gap-4 px-6 py-5">
                  <h1 className="text-xl font-semibold">已发送邮件</h1>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>发送至:</span>
                    <span className="font-medium text-foreground">{selectedMail.address}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    发送时间: {new Date(selectedMail.created_at).toLocaleString()}
                  </div>
                  <Separator />
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {(selectedMail.raw || "").slice(0, 2000)}
                    {selectedMail.raw && selectedMail.raw.length > 2000 ? "..." : ""}
                  </div>
                </div>
              </ScrollArea>
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><Forward /></EmptyMedia>
                <EmptyTitle>选择一封邮件</EmptyTitle>
                <EmptyDescription>点击左侧邮件查看详情</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </div>

      {mails.length > 0 && (
        <div className="border-t border-border px-4 py-2">
          <DataTablePagination page={page} pageSize={pageSize} totalCount={data?.count ?? 0} onPageChange={setPage} />
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>删除后无法恢复，确定要删除这封已发送邮件吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
