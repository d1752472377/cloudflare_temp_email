"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Trash2, Pencil, Users, Send } from "lucide-react"

import api from "@/lib/api"
import { hashPassword } from "@/lib/crypto"
import { ConsolePage } from "@/components/console/console-page"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTablePagination } from "@/components/shared/data-table-pagination"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import type { PaginatedResponse, AdminUser, UserRole, AddressSender } from "@/lib/types"

// Tab 1: 用户列表
function UserListTab() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [pageSize] = useState(20)
  const [query, setQuery] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [createEmail, setCreateEmail] = useState("")
  const [createPassword, setCreatePassword] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; email: string } | null>(null)
  const [resetTarget, setResetTarget] = useState<number | null>(null)
  const [resetPassword, setResetPassword] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["admin_users", page, pageSize, query],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String(page * pageSize) })
      if (query) params.set("query", query)
      const { data } = await api.get<PaginatedResponse<AdminUser>>(`/admin/users?${params}`)
      return data
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const hashed = await hashPassword(createPassword)
      return api.post("/admin/users", { email: createEmail, password: hashed })
    },
    onSuccess: () => { toast.success("用户创建成功"); queryClient.invalidateQueries({ queryKey: ["admin_users"] }); setShowCreate(false); setCreateEmail(""); setCreatePassword("") },
    onError: () => toast.error("创建失败"),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/users/${id}`),
    onSuccess: () => { toast.success("已删除"); queryClient.invalidateQueries({ queryKey: ["admin_users"] }); setDeleteTarget(null) },
    onError: () => toast.error("删除失败"),
  })

  const resetMutation = useMutation({
    mutationFn: async ({ id, pw }: { id: number; pw: string }) => {
      const hashed = await hashPassword(pw)
      return api.post(`/admin/users/${id}/reset_password`, { password: hashed })
    },
    onSuccess: () => { toast.success("密码已重置"); setResetTarget(null); setResetPassword("") },
    onError: () => toast.error("重置失败"),
  })

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Input placeholder="搜索用户邮箱..." value={query} onChange={(e) => { setQuery(e.target.value); setPage(0) }} className="max-w-xs" />
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="size-3.5" /> 创建用户</Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : !data?.results?.length ? (
        <Empty><EmptyHeader><EmptyMedia variant="icon"><Users /></EmptyMedia><EmptyTitle>暂无用户</EmptyTitle></EmptyHeader></Empty>
      ) : (
        <>
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>邮箱</TableHead><TableHead>角色</TableHead><TableHead>邮箱数</TableHead><TableHead>注册时间</TableHead><TableHead className="w-24" /></TableRow></TableHeader>
            <TableBody>
              {data.results.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="text-xs">{u.id}</TableCell>
                  <TableCell className="text-xs">{u.user_email}</TableCell>
                  <TableCell className="text-xs">{u.role_text || "普通用户"}</TableCell>
                  <TableCell className="text-xs">{u.address_count}</TableCell>
                  <TableCell className="text-xs">{u.created_at}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => setResetTarget(u.id)}><Pencil className="size-3" /></Button>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget({ id: u.id, email: u.user_email })}><Trash2 className="size-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <DataTablePagination page={page} pageSize={pageSize} totalCount={data.count} onPageChange={setPage} />
        </>
      )}

      <Dialog open={showCreate} onOpenChange={() => { setShowCreate(false); setCreateEmail(""); setCreatePassword("") }}>
        <DialogContent>
          <DialogHeader><DialogTitle>创建用户</DialogTitle><DialogDescription>输入新用户的邮箱和密码</DialogDescription></DialogHeader>
          <FieldGroup>
            <Field><FieldLabel>邮箱</FieldLabel><Input value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} /></Field>
            <Field><FieldLabel>密码</FieldLabel><Input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} /></Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
            <Button disabled={!createEmail || !createPassword} onClick={() => createMutation.mutate()}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>确认删除用户</AlertDialogTitle><AlertDialogDescription>删除用户 {deleteTarget?.email} 后无法恢复。</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>确认删除</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={resetTarget !== null} onOpenChange={() => { setResetTarget(null); setResetPassword("") }}>
        <DialogContent>
          <DialogHeader><DialogTitle>重置密码</DialogTitle><DialogDescription>输入新密码</DialogDescription></DialogHeader>
          <FieldGroup>
            <Field><FieldLabel>新密码</FieldLabel><Input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} /></Field>
          </FieldGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetTarget(null); setResetPassword("") }}>取消</Button>
            <Button disabled={!resetPassword} onClick={() => resetTarget && resetMutation.mutate({ id: resetTarget, pw: resetPassword })}>确认重置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Tab 2: 角色管理
function RolesTab() {
  const queryClient = useQueryClient()
  const [roles, setRoles] = useState<UserRole[]>([])

  const { isLoading } = useQuery({
    queryKey: ["admin_roles"],
    queryFn: async () => {
      const { data } = await api.get<{ roles: UserRole[] }>("/admin/roles")
      setRoles(data.roles || [])
      return data.roles
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => api.post("/admin/roles", { roles }),
    onSuccess: () => toast.success("角色已保存"),
    onError: () => toast.error("保存失败"),
  })

  const addRole = () => setRoles([...roles, { role: "", prefix: null, domains: [] }])
  const removeRole = (i: number) => setRoles(roles.filter((_, idx) => idx !== i))
  const updateRole = (i: number, field: keyof UserRole, value: string | string[] | null) => {
    const next = [...roles]
    next[i] = { ...next[i], [field]: value }
    setRoles(next)
  }

  if (isLoading) return <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>

  return (
    <div>
      <div className="flex flex-col gap-3">
        {roles.map((r, i) => (
          <div key={i} className="flex items-end gap-2 rounded-lg border border-border p-3">
            <Field className="flex-1"><FieldLabel>角色名</FieldLabel><Input value={r.role} onChange={(e) => updateRole(i, "role", e.target.value)} /></Field>
            <Field className="flex-1"><FieldLabel>前缀</FieldLabel><Input value={r.prefix || ""} onChange={(e) => updateRole(i, "prefix", e.target.value || null)} /></Field>
            <Button variant="ghost" size="icon-sm" className="text-destructive mb-0.5" onClick={() => removeRole(i)}><Trash2 className="size-3.5" /></Button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Button variant="outline" size="sm" onClick={addRole}><Plus className="size-3.5" /> 添加角色</Button>
        <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>保存</Button>
      </div>
    </div>
  )
}

// Tab 3: 角色地址配置
function RoleAddressConfigTab() {
  const queryClient = useQueryClient()
  const [configs, setConfigs] = useState<Record<string, { maxAddressCount: number }>>({})

  const { isLoading } = useQuery({
    queryKey: ["role_address_config"],
    queryFn: async () => {
      const { data } = await api.get<Record<string, { maxAddressCount: number }>>("/admin/role_address_config")
      setConfigs(data)
      return data
    },
  })

  const saveMutation = useMutation({
    mutationFn: () => api.post("/admin/role_address_config", configs),
    onSuccess: () => toast.success("配置已保存"),
    onError: () => toast.error("保存失败"),
  })

  if (isLoading) return <Skeleton className="h-32 w-full" />

  return (
    <div>
      <div className="flex flex-col gap-3">
        {Object.entries(configs).map(([role, cfg]) => (
          <div key={role} className="flex items-end gap-2 rounded-lg border border-border p-3">
            <span className="mb-1.5 text-sm font-medium">{role}</span>
            <Field className="flex-1">
              <FieldLabel>最大地址数</FieldLabel>
              <Input type="number" value={cfg.maxAddressCount} onChange={(e) => setConfigs({ ...configs, [role]: { maxAddressCount: Number(e.target.value) } })} />
            </Field>
          </div>
        ))}
        {Object.keys(configs).length === 0 && <p className="text-sm text-muted-foreground">暂无角色配置，请先在角色管理中添加角色。</p>}
      </div>
      <Button className="mt-3" size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>保存</Button>
    </div>
  )
}

// Tab 4: 发件权限
function SenderTab() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [pageSize] = useState(20)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin_senders", page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<AddressSender>>(`/admin/address_sender?limit=${pageSize}&offset=${page * pageSize}`)
      return data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/address_sender/${id}`),
    onSuccess: () => { toast.success("已删除"); queryClient.invalidateQueries({ queryKey: ["admin_senders"] }); setDeleteId(null) },
  })

  return (
    <>
      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : !data?.results?.length ? (
        <Empty><EmptyHeader><EmptyMedia variant="icon"><Send /></EmptyMedia><EmptyTitle>暂无发件权限配置</EmptyTitle></EmptyHeader></Empty>
      ) : (
        <>
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>地址</TableHead><TableHead>余额</TableHead><TableHead>状态</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
            <TableBody>
              {data.results.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-xs">{s.id}</TableCell>
                  <TableCell className="font-mono text-xs">{s.address}</TableCell>
                  <TableCell className="text-xs">{s.balance}</TableCell>
                  <TableCell className="text-xs">{s.enabled ? "启用" : "禁用"}</TableCell>
                  <TableCell><Button variant="ghost" size="icon-xs" className="text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <DataTablePagination page={page} pageSize={pageSize} totalCount={data.count} onPageChange={setPage} />
        </>
      )}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>确认删除</AlertDialogTitle><AlertDialogDescription>删除后无法恢复。</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>确认</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function UsersPage() {
  return (
    <ConsolePage title="用户与角色" description="管理用户、角色和发件权限">
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">用户列表</TabsTrigger>
          <TabsTrigger value="roles">角色管理</TabsTrigger>
          <TabsTrigger value="roleConfig">角色地址配置</TabsTrigger>
          <TabsTrigger value="sender">发件权限</TabsTrigger>
        </TabsList>
        <TabsContent value="users"><UserListTab /></TabsContent>
        <TabsContent value="roles"><RolesTab /></TabsContent>
        <TabsContent value="roleConfig"><RoleAddressConfigTab /></TabsContent>
        <TabsContent value="sender"><SenderTab /></TabsContent>
      </Tabs>
    </ConsolePage>
  )
}
