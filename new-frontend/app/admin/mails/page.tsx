"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Trash2, Send, Mail } from "lucide-react"

import api from "@/lib/api"
import { ConsolePage } from "@/components/console/console-page"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTablePagination } from "@/components/shared/data-table-pagination"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { PaginatedResponse, RawMail, SendboxMail } from "@/lib/types"

function AllMailsTab() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [pageSize] = useState(20)
  const [filter, setFilter] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin_mails", page, pageSize, filter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String(page * pageSize) })
      if (filter) params.set("address", filter)
      const { data } = await api.get<PaginatedResponse<RawMail>>(`/admin/mails?${params}`)
      return data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/mails/${id}`),
    onSuccess: () => { toast.success("已删除"); queryClient.invalidateQueries({ queryKey: ["admin_mails"] }); setDeleteId(null) },
    onError: () => toast.error("删除失败"),
  })

  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <Input placeholder="按地址筛选..." value={filter} onChange={(e) => { setFilter(e.target.value); setPage(0) }} className="max-w-xs" />
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : !data?.results?.length ? (
        <Empty><EmptyHeader><EmptyMedia variant="icon"><Mail /></EmptyMedia><EmptyTitle>暂无邮件</EmptyTitle></EmptyHeader></Empty>
      ) : (
        <>
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>地址</TableHead><TableHead>来源</TableHead><TableHead>时间</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
            <TableBody>
              {data.results.map((mail) => (
                <TableRow key={mail.id}>
                  <TableCell className="text-xs">{mail.id}</TableCell>
                  <TableCell className="font-mono text-xs">{mail.address}</TableCell>
                  <TableCell className="text-xs">{mail.source}</TableCell>
                  <TableCell className="text-xs">{mail.created_at}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-xs" className="text-destructive" onClick={() => setDeleteId(mail.id)}><Trash2 /></Button>
                  </TableCell>
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

function UnknownMailsTab() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [pageSize] = useState(20)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin_unknown_mails", page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<RawMail>>(`/admin/mails_unknow?limit=${pageSize}&offset=${page * pageSize}`)
      return data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/mails/${id}`),
    onSuccess: () => { toast.success("已删除"); queryClient.invalidateQueries({ queryKey: ["admin_unknown_mails"] }); setDeleteId(null) },
  })

  return (
    <>
      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : !data?.results?.length ? (
        <Empty><EmptyHeader><EmptyMedia variant="icon"><Mail /></EmptyMedia><EmptyTitle>暂无未知收件人邮件</EmptyTitle></EmptyHeader></Empty>
      ) : (
        <>
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>地址</TableHead><TableHead>来源</TableHead><TableHead>时间</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
            <TableBody>
              {data.results.map((mail) => (
                <TableRow key={mail.id}>
                  <TableCell className="text-xs">{mail.id}</TableCell>
                  <TableCell className="font-mono text-xs">{mail.address}</TableCell>
                  <TableCell className="text-xs">{mail.source}</TableCell>
                  <TableCell className="text-xs">{mail.created_at}</TableCell>
                  <TableCell><Button variant="ghost" size="icon-xs" className="text-destructive" onClick={() => setDeleteId(mail.id)}><Trash2 /></Button></TableCell>
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

function SendboxTab() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [pageSize] = useState(20)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin_sendbox", page, pageSize],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<SendboxMail>>(`/admin/sendbox?limit=${pageSize}&offset=${page * pageSize}`)
      return data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/sendbox/${id}`),
    onSuccess: () => { toast.success("已删除"); queryClient.invalidateQueries({ queryKey: ["admin_sendbox"] }); setDeleteId(null) },
  })

  return (
    <>
      {isLoading ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : !data?.results?.length ? (
        <Empty><EmptyHeader><EmptyMedia variant="icon"><Send /></EmptyMedia><EmptyTitle>发件箱为空</EmptyTitle></EmptyHeader></Empty>
      ) : (
        <>
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>地址</TableHead><TableHead>时间</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
            <TableBody>
              {data.results.map((mail) => (
                <TableRow key={mail.id}>
                  <TableCell className="text-xs">{mail.id}</TableCell>
                  <TableCell className="font-mono text-xs">{mail.address}</TableCell>
                  <TableCell className="text-xs">{mail.created_at}</TableCell>
                  <TableCell><Button variant="ghost" size="icon-xs" className="text-destructive" onClick={() => setDeleteId(mail.id)}><Trash2 /></Button></TableCell>
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

function SendMailTab() {
  const [fromMail, setFromMail] = useState("")
  const [toMail, setToMail] = useState("")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [isHtml, setIsHtml] = useState(false)

  const sendMutation = useMutation({
    mutationFn: () => api.post("/admin/send_mail", { from_mail: fromMail, to_mail: toMail, subject, content, is_html: isHtml }),
    onSuccess: () => { toast.success("邮件已发送"); setToMail(""); setSubject(""); setContent("") },
    onError: () => toast.error("发送失败"),
  })

  return (
    <div className="max-w-lg">
      <FieldGroup>
        <Field><FieldLabel>发件地址</FieldLabel><Input value={fromMail} onChange={(e) => setFromMail(e.target.value)} placeholder="admin@example.com" /></Field>
        <Field><FieldLabel>收件地址</FieldLabel><Input value={toMail} onChange={(e) => setToMail(e.target.value)} placeholder="recipient@example.com" /></Field>
        <Field><FieldLabel>主题</FieldLabel><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></Field>
        <Field><FieldLabel>内容</FieldLabel><Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} /></Field>
        <Field>
          <div className="flex items-center justify-between">
            <FieldLabel>HTML 格式</FieldLabel>
            <Switch checked={isHtml} onCheckedChange={setIsHtml} />
          </div>
        </Field>
      </FieldGroup>
      <Button className="mt-4" onClick={() => sendMutation.mutate()} disabled={!fromMail || !toMail || !subject || sendMutation.isPending}>
        <Send className="size-3.5" /> 发送邮件
      </Button>
    </div>
  )
}

export default function MailsPage() {
  return (
    <ConsolePage title="邮件中心" description="管理所有邮件">
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">全部邮件</TabsTrigger>
          <TabsTrigger value="unknown">未知收件人</TabsTrigger>
          <TabsTrigger value="sendbox">发件箱</TabsTrigger>
          <TabsTrigger value="send">代发邮件</TabsTrigger>
        </TabsList>
        <TabsContent value="all"><AllMailsTab /></TabsContent>
        <TabsContent value="unknown"><UnknownMailsTab /></TabsContent>
        <TabsContent value="sendbox"><SendboxTab /></TabsContent>
        <TabsContent value="send"><SendMailTab /></TabsContent>
      </Tabs>
    </ConsolePage>
  )
}
