"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { AlertTriangle, Key, Pencil, Plus, Trash2 } from "lucide-react"

import api from "@/lib/api"
import { hashPassword } from "@/lib/crypto"
import { ConsolePage } from "@/components/console/console-page"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { PasskeyInfo } from "@/lib/types"

export default function SecurityPage() {
  const queryClient = useQueryClient()

  // Passkey state
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [showRegister, setShowRegister] = useState(false)
  const [passkeyName, setPasskeyName] = useState("")

  // Password state
  const [oldPw, setOldPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")

  // Danger action state
  const [dangerAction, setDangerAction] = useState<string | null>(null)

  const { data: passkeys, isLoading } = useQuery({
    queryKey: ["passkeys"],
    queryFn: async () => {
      const { data } = await api.get<PasskeyInfo[]>("/user_api/passkey")
      return data
    },
  })

  const { data: mailboxSettings } = useQuery({
    queryKey: ["user_mailbox_settings"],
    queryFn: async () => {
      const { data } = await api.get<{ address: string }>("/api/settings")
      return data
    },
    retry: false,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/user_api/passkey/${id}`),
    onSuccess: () => { toast.success("已删除"); queryClient.invalidateQueries({ queryKey: ["passkeys"] }); setDeleteId(null) },
    onError: () => toast.error("删除失败"),
  })

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.post("/user_api/passkey/rename", { passkey_id: id, passkey_name: name }),
    onSuccess: () => { toast.success("已重命名"); queryClient.invalidateQueries({ queryKey: ["passkeys"] }); setRenameId(null) },
    onError: () => toast.error("重命名失败"),
  })

  const registerMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: options } = await api.post("/user_api/passkey/register_request", { domain: window.location.hostname })
      const credential = await navigator.credentials.create({ publicKey: options })
      await api.post("/user_api/passkey/register_response", { credential, origin: window.location.origin, passkey_name: name })
    },
    onSuccess: () => { toast.success("Passkey 注册成功"); queryClient.invalidateQueries({ queryKey: ["passkeys"] }); setShowRegister(false); setPasskeyName("") },
    onError: () => toast.error("注册失败"),
  })

  const changePwMutation = useMutation({
    mutationFn: async () => {
      if (mailboxSettings?.address) {
        const hashed = await hashPassword(newPw)
        return api.post("/api/address_change_password", { new_password: hashed })
      } else {
        const hashed = await hashPassword(oldPw)
        const newHashed = await hashPassword(newPw)
        return api.post("/user_api/change_password", { old_password: hashed, new_password: newHashed })
      }
    },
    onSuccess: () => { toast.success("密码已修改"); setOldPw(""); setNewPw(""); setConfirmPw("") },
    onError: () => toast.error("密码修改失败"),
  })

  const handleChangePw = () => {
    if (!newPw) { toast.error("请输入新密码"); return }
    if (newPw !== confirmPw) { toast.error("两次密码不一致"); return }
    changePwMutation.mutate()
  }

  const dangerMutations: Record<string, { label: string; action: () => void }> = {
    clearInbox: {
      label: "清空收件箱",
      action: () => {
        api.delete("/api/clear_inbox").then(() => {
          toast.success("收件箱已清空"); setDangerAction(null)
        }).catch(() => toast.error("操作失败"))
      },
    },
    clearSent: {
      label: "清空发件箱",
      action: () => {
        api.delete("/api/clear_sent_items").then(() => {
          toast.success("发件箱已清空"); setDangerAction(null)
        }).catch(() => toast.error("操作失败"))
      },
    },
  }

  return (
    <ConsolePage title="账号安全" description="修改密码、管理 Passkey 和数据清理">
      <div className="flex flex-col gap-6">
        {/* 1. Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">修改密码</CardTitle>
            <CardDescription>{mailboxSettings?.address || "修改当前邮箱或账户密码"}</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              {!mailboxSettings?.address && (
                <Field>
                  <FieldLabel htmlFor="old-pw">当前密码</FieldLabel>
                  <Input id="old-pw" type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="new-pw">新密码</FieldLabel>
                <Input id="new-pw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm-pw">确认新密码</FieldLabel>
                <Input id="confirm-pw" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChangePw()} />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter>
            <Button onClick={handleChangePw} disabled={!newPw || changePwMutation.isPending}>更新密码</Button>
          </CardFooter>
        </Card>

        {/* 2. Passkey Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Passkey 管理</CardTitle>
              <Button size="sm" onClick={() => setShowRegister(true)}>
                <Plus className="size-3.5" /> 添加 Passkey
              </Button>
            </div>
            <CardDescription>使用指纹、面容或安全密钥免密登录</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : !passkeys?.length ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Key /></EmptyMedia>
                  <EmptyTitle>暂无 Passkey</EmptyTitle>
                  <EmptyDescription>添加一个 Passkey 来增强账户安全。</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="divide-y divide-border rounded-md border border-border">
                {passkeys.map((pk) => (
                  <div key={pk.passkey_id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-sm font-medium">{pk.passkey_name}</div>
                      <div className="text-xs text-muted-foreground">创建于 {pk.created_at}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setRenameId(pk.passkey_id); setRenameValue(pk.passkey_name) }}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteId(pk.passkey_id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* 3. Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="size-4" />
              危险操作
            </CardTitle>
            <CardDescription>以下操作不可撤销，执行前需二次确认</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {Object.entries(dangerMutations).map(([key, item]) => (
              <div key={key} className="flex items-center justify-between rounded-md border border-border px-4 py-3">
                <span className="text-sm font-medium">{item.label}</span>
                <Button variant="destructive" size="sm" onClick={() => setDangerAction(key)}>
                  {item.label}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Passkey Delete Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除 Passkey</AlertDialogTitle>
            <AlertDialogDescription>删除后无法恢复，确定要删除吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Passkey Rename Dialog */}
      <Dialog open={renameId !== null} onOpenChange={() => { setRenameId(null); setRenameValue("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名 Passkey</DialogTitle>
            <DialogDescription>输入新的名称</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>名称</FieldLabel>
              <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRenameId(null); setRenameValue("") }}>取消</Button>
            <Button disabled={!renameValue} onClick={() => renameId && renameMutation.mutate({ id: renameId, name: renameValue })}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Passkey Register Dialog */}
      <Dialog open={showRegister} onOpenChange={() => { setShowRegister(false); setPasskeyName("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加 Passkey</DialogTitle>
            <DialogDescription>为这个 Passkey 起一个名称</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>名称</FieldLabel>
              <Input value={passkeyName} onChange={(e) => setPasskeyName(e.target.value)} placeholder="例如: MacBook Pro" />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowRegister(false); setPasskeyName("") }}>取消</Button>
            <Button disabled={!passkeyName} onClick={() => registerMutation.mutate(passkeyName)}>注册</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Danger Confirm Dialog */}
      <AlertDialog open={dangerAction !== null} onOpenChange={() => setDangerAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              确认{dangerAction ? dangerMutations[dangerAction]?.label : ""}
            </AlertDialogTitle>
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
    </ConsolePage>
  )
}
