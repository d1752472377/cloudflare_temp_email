"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { AlertTriangle, Database, Trash2, RefreshCw } from "lucide-react"

import api from "@/lib/api"
import { ConsolePage } from "@/components/console/console-page"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { WorkerConfigs, DbVersion, AutoCleanupSettings } from "@/lib/types"

// Tab 1: Worker 配置
function WorkerConfigTab() {
  const { data: configs, isLoading } = useQuery({
    queryKey: ["worker_configs"],
    queryFn: async () => {
      const { data } = await api.get<WorkerConfigs>("/admin/worker/configs")
      return data
    },
  })

  if (isLoading) return <Skeleton className="h-64 w-full" />
  if (!configs) return null

  return (
    <div className="flex flex-col gap-2">
      {Object.entries(configs).map(([key, value]) => (
        <div key={key} className="flex items-start gap-3 rounded-lg border border-border px-3 py-2">
          <span className="min-w-[200px] shrink-0 font-mono text-xs font-medium">{key}</span>
          <span className="break-all text-xs text-muted-foreground">{String(value)}</span>
        </div>
      ))}
    </div>
  )
}

// Tab 2: 数据库管理
function DatabaseTab() {
  const [confirmAction, setConfirmAction] = useState<"init" | "migrate" | null>(null)

  const { data: version, isLoading, refetch } = useQuery({
    queryKey: ["db_version"],
    queryFn: async () => {
      const { data } = await api.get<DbVersion>("/admin/db_version")
      return data
    },
  })

  const initMutation = useMutation({
    mutationFn: () => api.post("/admin/db_initialize"),
    onSuccess: () => { toast.success("数据库初始化成功"); refetch(); setConfirmAction(null) },
    onError: () => toast.error("初始化失败"),
  })

  const migrateMutation = useMutation({
    mutationFn: () => api.post("/admin/db_migration"),
    onSuccess: () => { toast.success("数据库迁移成功"); refetch(); setConfirmAction(null) },
    onError: () => toast.error("迁移失败"),
  })

  if (isLoading) return <Skeleton className="h-48 w-full" />

  return (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertTriangle className="size-4" />
        <AlertTitle>数据库操作有风险</AlertTitle>
        <AlertDescription>请确保已备份数据后再执行数据库操作。</AlertDescription>
      </Alert>

      <Card>
        <CardHeader><CardTitle className="text-sm">版本状态</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1 text-sm">
            <span>当前 DB 版本: <code className="rounded bg-muted px-1">{version?.current_db_version}</code></span>
            <span>代码 DB 版本: <code className="rounded bg-muted px-1">{version?.code_db_version}</code></span>
            <span>需要初始化: {version?.need_initialization ? "是" : "否"}</span>
            <span>需要迁移: {version?.need_migration ? "是" : "否"}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        {version?.need_initialization && (
          <Button variant="destructive" onClick={() => setConfirmAction("init")}>
            <Database className="size-3.5" /> 初始化数据库
          </Button>
        )}
        {version?.need_migration && (
          <Button variant="destructive" onClick={() => setConfirmAction("migrate")}>
            <RefreshCw className="size-3.5" /> 运行迁移
          </Button>
        )}
      </div>

      <AlertDialog open={confirmAction !== null} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" /> 确认执行
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "init" && "初始化数据库将创建所有表结构。如果数据库已存在数据，可能导致数据丢失。确定要继续吗？"}
              {confirmAction === "migrate" && "运行数据库迁移将修改表结构。请确保已备份数据。确定要继续吗？"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmAction === "init" ? initMutation.mutate() : migrateMutation.mutate()}>
              确认执行
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Tab 3: 清理
function CleanupTab() {
  const [cleanType, setCleanType] = useState("mails")
  const [cleanDays, setCleanDays] = useState(30)
  const [autoSettings, setAutoSettings] = useState<AutoCleanupSettings | null>(null)

  useQuery({
    queryKey: ["auto_cleanup"],
    queryFn: async () => {
      const { data } = await api.get<AutoCleanupSettings>("/admin/auto_cleanup")
      setAutoSettings(data)
      return data
    },
  })

  const cleanupMutation = useMutation({
    mutationFn: () => api.post("/admin/cleanup", { cleanType, cleanDays }),
    onSuccess: () => toast.success("清理完成"),
    onError: () => toast.error("清理失败"),
  })

  const saveAutoMutation = useMutation({
    mutationFn: () => api.post("/admin/auto_cleanup", autoSettings),
    onSuccess: () => toast.success("自动清理设置已保存"),
    onError: () => toast.error("保存失败"),
  })

  const cleanTypes = [
    { value: "mails", label: "邮件" },
    { value: "unknownMails", label: "未知收件人邮件" },
    { value: "sendbox", label: "发件箱" },
    { value: "addresses", label: "地址" },
    { value: "inactiveAddresses", label: "不活跃地址" },
    { value: "unboundAddresses", label: "未绑定地址" },
    { value: "emptyAddresses", label: "空地址" },
    { value: "ipList", label: "IP 列表" },
  ]

  const autoUpdate = (patch: Partial<AutoCleanupSettings>) => setAutoSettings(autoSettings ? { ...autoSettings, ...patch } : null)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-3 text-sm font-medium">手动清理</h3>
        <div className="flex items-end gap-2">
          <Field className="flex-1">
            <FieldLabel>清理类型</FieldLabel>
            <select className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm" value={cleanType} onChange={(e) => setCleanType(e.target.value)}>
              {cleanTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field className="w-32">
            <FieldLabel>保留天数</FieldLabel>
            <input type="number" className="h-8 w-full rounded-md border border-border bg-background px-2 text-sm" value={cleanDays} onChange={(e) => setCleanDays(Number(e.target.value))} />
          </Field>
          <Button variant="destructive" onClick={() => cleanupMutation.mutate()} disabled={cleanupMutation.isPending}>
            <Trash2 className="size-3.5" /> 执行清理
          </Button>
        </div>
      </div>

      {autoSettings && (
        <div>
          <h3 className="mb-3 text-sm font-medium">自动清理</h3>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">启用自动清理</span>
                  <Switch checked={autoSettings.enableAutoCleanup} onCheckedChange={(v) => autoUpdate({ enableAutoCleanup: v })} />
                </div>
                {autoSettings.enableAutoCleanup && (
                  <>
                    {[
                      { key: "cleanInactiveAddress" as const, label: "不活跃地址", daysKey: "cleanInactiveAddressDays" as const },
                      { key: "cleanMails" as const, label: "邮件", daysKey: "cleanMailsDays" as const },
                      { key: "cleanSendbox" as const, label: "发件箱", daysKey: "cleanSendboxDays" as const },
                      { key: "cleanUnknownMails" as const, label: "未知收件人", daysKey: "cleanUnknownMailsDays" as const },
                      { key: "cleanIpList" as const, label: "IP 列表", daysKey: "cleanIpListDays" as const },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center gap-4">
                        <div className="flex items-center gap-2 flex-1">
                          <Switch checked={autoSettings[item.key]} onCheckedChange={(v) => autoUpdate({ [item.key]: v })} />
                          <span className="text-sm">{item.label}</span>
                        </div>
                        {autoSettings[item.key] && (
                          <div className="flex items-center gap-1">
                            <input type="number" className="h-7 w-16 rounded-md border border-border bg-background px-2 text-xs" value={autoSettings[item.daysKey]} onChange={(e) => autoUpdate({ [item.daysKey]: Number(e.target.value) })} />
                            <span className="text-xs text-muted-foreground">天</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
              <Button className="mt-4" size="sm" onClick={() => saveAutoMutation.mutate()} disabled={saveAutoMutation.isPending}>保存</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function OperationsPage() {
  return (
    <ConsolePage title="运维" description="Worker 配置、数据库管理与清理">
      <Tabs defaultValue="worker">
        <TabsList>
          <TabsTrigger value="worker">Worker 配置</TabsTrigger>
          <TabsTrigger value="database">数据库管理</TabsTrigger>
          <TabsTrigger value="cleanup">清理</TabsTrigger>
        </TabsList>
        <TabsContent value="worker"><WorkerConfigTab /></TabsContent>
        <TabsContent value="database"><DatabaseTab /></TabsContent>
        <TabsContent value="cleanup"><CleanupTab /></TabsContent>
      </Tabs>
    </ConsolePage>
  )
}
