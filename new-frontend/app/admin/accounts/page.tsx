"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, MoreHorizontal, Eye, KeyRound, Trash2, Inbox, Send } from "lucide-react"

import api from "@/lib/api"
import { hashPassword } from "@/lib/crypto"
import { ConsolePage } from "@/components/console/console-page"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTablePagination } from "@/components/shared/data-table-pagination"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { PaginatedResponse, AdminAddress } from "@/lib/types"

function AddressListTab() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [pageSize] = useState(20)
  const [query, setQuery] = useState("")
  const [actionTarget, setActionTarget] = useState<{ id: number; action: string } | null>(null)
  const [resetPasswordId, setResetPasswordId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [showPasswordId, setShowPasswordId] = useState<number | null>(null)
  const [showPasswordValue, setShowPasswordValue] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["admin_addresses", page, pageSize, query],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String(page * pageSize) })
      if (query) params.set("query", query)
      const { data } = await api.get<PaginatedResponse<AdminAddress>>(`/admin/address?${params}`)
      return data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/delete_address/${id}`),
    onSuccess: () => { toast.success("已删除"); queryClient.invalidateQueries({ queryKey: ["admin_addresses"] }); setActionTarget(null) },
    onError: () => toast.error("删除失败"),
  })

  const clearInboxMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/clear_inbox/${id}`),
    onSuccess: () => { toast.success("已清空收件箱"); setActionTarget(null) },
    onError: () => toast.error("操作失败"),
  })

  const clearSentMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/clear_sent_items/${id}`),
    onSuccess: () => { toast.success("已清空发件箱"); setActionTarget(null) },
    onError: () => toast.error("操作失败"),
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      const hashed = await hashPassword(password)
      return api.post(`/admin/address/${id}/reset_password`, { password: hashed })
    },
    onSuccess: () => { toast.success("密码已重置"); setResetPasswordId(null); setNewPassword("") },
    onError: () => toast.error("重置失败"),
  })

  const fetchPassword = async (id: number) => {
    try {
      const { data } = await api.get<{ jwt: string }>(`/admin/show_password/${id}`)
      setShowPasswordValue(data.jwt)
      setShowPasswordId(id)
    } catch {
      toast.error("获取密码失败")
    }
  }

  const handleAction = (id: number, action: string) => {
    if (action === "viewPassword") return fetchPassword(id)
    if (action === "resetPassword") return setResetPasswordId(id)
    setActionTarget({ id, action })
  }

  const executeAction = () => {
    if (!actionTarget) return
    const { id, action } = actionTarget
    if (action === "clearInbox") clearInboxMutation.mutate(id)
    else if (action === "clearSent") clearSentMutation.mutate(id)
    else if (action === "delete") deleteMutation.mutate(id)
  }

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Input placeholder="搜索邮箱地址..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(0) }} className="max-w-xs" />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : !data?.results?.length ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Inbox /></EmptyMedia>
            <EmptyTitle>暂无邮箱</EmptyTitle>
            <EmptyDescription>没有找到匹配的邮箱地址。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>地址</TableHead>
                <TableHead>邮件数</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.results.map((addr) => (
                <TableRow key={addr.id}>
                  <TableCell className="text-xs">{addr.id}</TableCell>
                  <TableCell className="font-mono text-xs">{addr.name}</TableCell>
                  <TableCell className="text-xs">{addr.mail_count}</TableCell>
                  <TableCell className="text-xs">{addr.created_at}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-xs" />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleAction(addr.id, "viewPassword")}>
                          <Eye className="size-3.5" /> 查看密码
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(addr.id, "resetPassword")}>
                          <KeyRound className="size-3.5" /> 重置密码
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(addr.id, "clearInbox")}>
                          <Inbox className="size-3.5" /> 清空收件箱
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(addr.id, "clearSent")}>
                          <Send className="size-3.5" /> 清空发件箱
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction(addr.id, "delete")} className="text-destructive">
                          <Trash2 className="size-3.5" /> 删除地址
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <DataTablePagination page={page} pageSize={pageSize} totalCount={data.count} onPageChange={setPage} />
        </>
      )}

      {/* 通用确认弹窗 */}
      <AlertDialog open={actionTarget !== null} onOpenChange={() => setActionTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认操作</AlertDialogTitle>
            <AlertDialogDescription>
              {actionTarget?.action === "delete" && "删除地址后无法恢复，确定要继续吗？"}
              {actionTarget?.action === "clearInbox" && "确定要清空该地址的收件箱吗？"}
              {actionTarget?.action === "clearSent" && "确定要清空该地址的发件箱吗？"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction}>确认</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 重置密码弹窗 */}
      <Dialog open={resetPasswordId !== null} onOpenChange={() => { setResetPasswordId(null); setNewPassword("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>输入新密码</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>新密码</FieldLabel>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetPasswordId(null); setNewPassword("") }}>取消</Button>
            <Button disabled={!newPassword} onClick={() => resetPasswordId && resetPasswordMutation.mutate({ id: resetPasswordId, password: newPassword })}>确认重置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看密码弹窗 */}
      <Dialog open={showPasswordId !== null} onOpenChange={() => { setShowPasswordId(null); setShowPasswordValue("") }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>地址凭证</DialogTitle>
            <DialogDescription>这是该邮箱地址的 JWT 凭证，可用于 API 访问。</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-muted/50 p-3">
            <code className="break-all text-xs">{showPasswordValue}</code>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { navigator.clipboard.writeText(showPasswordValue); toast.success("已复制") }}>复制</Button>
            <Button onClick={() => { setShowPasswordId(null); setShowPasswordValue("") }}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function CreateAddressTab() {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [domain, setDomain] = useState("")
  const [enablePrefix, setEnablePrefix] = useState(true)
  const [enableRandomSubdomain, setEnableRandomSubdomain] = useState(false)

  const { data: configs } = useQuery({
    queryKey: ["worker_configs"],
    queryFn: async () => {
      const { data } = await api.get<Record<string, unknown>>("/admin/worker/configs")
      return data
    },
  })

  const domains = (typeof configs?.DOMAINS === "string" ? configs.DOMAINS : Array.isArray(configs?.DOMAINS) ? (configs.DOMAINS as string[]).join(",") : "").split(",").filter(Boolean)

  const createMutation = useMutation({
    mutationFn: () => api.post("/admin/new_address", { name: name || undefined, domain: domain || undefined, enablePrefix, enableRandomSubdomain }),
    onSuccess: () => {
      toast.success("邮箱创建成功")
      queryClient.invalidateQueries({ queryKey: ["admin_addresses"] })
      setName("")
      setDomain("")
    },
    onError: () => toast.error("创建失败"),
  })

  return (
    <div className="max-w-md">
      <FieldGroup>
        <Field>
          <FieldLabel>地址名称（可选，留空则随机生成）</FieldLabel>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如: my-email" />
        </Field>
        {domains.length > 0 && (
          <Field>
            <FieldLabel>域名</FieldLabel>
            <select className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm" value={domain} onChange={(e) => setDomain(e.target.value)}>
              <option value="">自动选择</option>
              {domains.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
        )}
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>启用前缀</FieldLabel>
            <Switch checked={enablePrefix} onCheckedChange={setEnablePrefix} />
          </div>
          <FieldDescription>允许用户自定义地址前缀</FieldDescription>
        </Field>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>随机子域名</FieldLabel>
            <Switch checked={enableRandomSubdomain} onCheckedChange={setEnableRandomSubdomain} />
          </div>
          <FieldDescription>在域名前添加随机子域名</FieldDescription>
        </Field>
      </FieldGroup>
      <Button className="mt-4" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
        <Plus className="size-3.5" /> 创建邮箱
      </Button>
    </div>
  )
}

export default function AccountsPage() {
  return (
    <ConsolePage title="邮箱管理" description="管理所有邮箱地址">
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">地址列表</TabsTrigger>
          <TabsTrigger value="create">创建邮箱</TabsTrigger>
        </TabsList>
        <TabsContent value="list"><AddressListTab /></TabsContent>
        <TabsContent value="create"><CreateAddressTab /></TabsContent>
      </Tabs>
    </ConsolePage>
  )
}
