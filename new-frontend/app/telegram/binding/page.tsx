"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft, Link2Off, Plus, Mail } from "lucide-react"

import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { TelegramBindAddress } from "@/lib/types"

function getInitData(): string {
  if (typeof window !== "undefined") {
    try {
      const win = window as unknown as { Telegram?: { WebApp?: { initData?: string } } }
      if (win.Telegram?.WebApp?.initData) return win.Telegram.WebApp.initData
    } catch { /* ignore */ }
  }
  return ""
}

export default function TelegramBindingPage() {
  const queryClient = useQueryClient()
  const [initData, setInitData] = useState("")
  const [showBind, setShowBind] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [bindJwt, setBindJwt] = useState("")
  const [createAddress, setCreateAddress] = useState("")
  const [unbindTarget, setUnbindTarget] = useState<string | null>(null)

  useEffect(() => {
    setInitData(getInitData())
  }, [])

  const { data: bindings, isLoading } = useQuery({
    queryKey: ["tg_bindings", initData],
    queryFn: async () => {
      const { data } = await api.post<{ results: TelegramBindAddress[] }>("/telegram/get_bind_address", { initData })
      return data.results
    },
    enabled: !!initData,
  })

  const bindMutation = useMutation({
    mutationFn: (jwt: string) => api.post("/telegram/bind_address", { initData, jwt }),
    onSuccess: () => { toast.success("绑定成功"); queryClient.invalidateQueries({ queryKey: ["tg_bindings"] }); setShowBind(false); setBindJwt("") },
    onError: () => toast.error("绑定失败"),
  })

  const unbindMutation = useMutation({
    mutationFn: (address: string) => api.post("/telegram/unbind_address", { initData, address }),
    onSuccess: () => { toast.success("已解绑"); queryClient.invalidateQueries({ queryKey: ["tg_bindings"] }); setUnbindTarget(null) },
    onError: () => toast.error("解绑失败"),
  })

  const createMutation = useMutation({
    mutationFn: () => api.post("/telegram/new_address", { initData, address: createAddress || undefined }),
    onSuccess: () => { toast.success("地址已创建"); queryClient.invalidateQueries({ queryKey: ["tg_bindings"] }); setShowCreate(false); setCreateAddress("") },
    onError: () => toast.error("创建失败"),
  })

  if (!initData) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-sm text-muted-foreground">请通过 Telegram Mini App 访问此页面。</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-background p-4">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" render={<Link href="/" />}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-lg font-semibold">邮箱绑定</h1>
        </div>
        <div className="flex gap-1">
          <Button size="sm" onClick={() => setShowBind(true)}><Link2Off className="size-3.5" /> 绑定</Button>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="size-3.5" /> 新建</Button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : !bindings?.length ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Mail /></EmptyMedia>
            <EmptyTitle>暂无绑定</EmptyTitle>
            <EmptyDescription>绑定或创建一个邮箱地址开始使用。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-2">
          {bindings.map((b) => (
            <Card key={b.address}>
              <CardHeader className="flex-row items-center justify-between py-3">
                <CardTitle className="font-mono text-sm">{b.address}</CardTitle>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setUnbindTarget(b.address)}>解绑</Button>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showBind} onOpenChange={() => { setShowBind(false); setBindJwt("") }}>
        <DialogContent>
          <DialogHeader><DialogTitle>绑定邮箱</DialogTitle><DialogDescription>粘贴邮箱地址的 JWT 凭证</DialogDescription></DialogHeader>
          <FieldGroup>
            <Field><FieldLabel>JWT 凭证</FieldLabel><Input value={bindJwt} onChange={(e) => setBindJwt(e.target.value)} placeholder="eyJ..." /></Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBind(false)}>取消</Button>
            <Button disabled={!bindJwt} onClick={() => bindMutation.mutate(bindJwt)}>绑定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreate} onOpenChange={() => { setShowCreate(false); setCreateAddress("") }}>
        <DialogContent>
          <DialogHeader><DialogTitle>创建新邮箱</DialogTitle><DialogDescription>留空则随机生成地址</DialogDescription></DialogHeader>
          <FieldGroup>
            <Field><FieldLabel>地址名称（可选）</FieldLabel><Input value={createAddress} onChange={(e) => setCreateAddress(e.target.value)} placeholder="留空则随机" /></Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={unbindTarget !== null} onOpenChange={() => setUnbindTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>确认解绑</AlertDialogTitle><AlertDialogDescription>解绑 {unbindTarget} 后将无法通过 Telegram 接收其邮件。</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={() => unbindTarget && unbindMutation.mutate(unbindTarget)}>确认解绑</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
