"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowRightLeft, Link2Off, Plus, RefreshCw } from "lucide-react"

import api, { setAuthTokens } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { ConsolePage } from "@/components/console/console-page"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { CreateEmailModal } from "@/components/create-email-modal"
import type { BoundAddress } from "@/lib/types"

export default function AddressesPage() {
  const { switchMailbox } = useAuth()
  const queryClient = useQueryClient()
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [transferId, setTransferId] = useState<number | null>(null)
  const [transferEmail, setTransferEmail] = useState("")
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["bind_address"],
    queryFn: async () => {
      const { data } = await api.get<{ results: BoundAddress[] }>("/user_api/bind_address")
      return data.results
    },
  })

  const unbindMutation = useMutation({
    mutationFn: (addressId: number) => api.post("/user_api/unbind_address", { address_id: addressId }),
    onSuccess: () => {
      toast.success("已解绑")
      queryClient.invalidateQueries({ queryKey: ["bind_address"] })
      setDeleteId(null)
    },
    onError: () => toast.error("解绑失败"),
  })

  const transferMutation = useMutation({
    mutationFn: ({ addressId, email }: { addressId: number; email: string }) =>
      api.post("/user_api/transfer_address", { address_id: addressId, target_user_email: email }),
    onSuccess: () => {
      toast.success("转移成功")
      queryClient.invalidateQueries({ queryKey: ["bind_address"] })
      setTransferId(null)
      setTransferEmail("")
    },
    onError: () => toast.error("转移失败"),
  })

  return (
    <>
    <ConsolePage
      title="管理地址"
      description="管理名下绑定的邮箱地址"
      actions={
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="size-3.5" /> 新增地址
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)
        ) : !data?.length ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><RefreshCw /></EmptyMedia>
              <EmptyTitle>暂无绑定邮箱</EmptyTitle>
              <EmptyDescription>你还没有绑定任何邮箱地址。</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          data.map((addr) => (
            <Card key={addr.id}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="font-mono text-sm">{addr.name}</CardTitle>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => switchMailbox(addr.id).catch(() => toast.error("切换失败"))}>
                    <ArrowRightLeft className="size-3.5" /> 切换
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setTransferId(addr.id)}>转移</Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(addr.id)}>
                    <Link2Off className="size-3.5" /> 解绑
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <span className="text-xs text-muted-foreground">邮件 {addr.mail_count} · 发件 {addr.send_count}</span>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认解绑</AlertDialogTitle>
            <AlertDialogDescription>解绑后该邮箱将从你的账户中移除。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && unbindMutation.mutate(deleteId)}>确认</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={transferId !== null} onOpenChange={() => { setTransferId(null); setTransferEmail("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>转移邮箱</DialogTitle>
            <DialogDescription>输入目标用户的邮箱地址</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>目标用户邮箱</FieldLabel>
              <Input value={transferEmail} onChange={(e) => setTransferEmail(e.target.value)} placeholder="user@example.com" />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTransferId(null); setTransferEmail("") }}>取消</Button>
            <Button disabled={!transferEmail} onClick={() => transferId && transferMutation.mutate({ addressId: transferId, email: transferEmail })}>确认转移</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConsolePage>

      {/* Create Address Dialog */}
      <CreateEmailModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => queryClient.invalidateQueries({ queryKey: ["bind_address"] })} />
    </>
  )
}
