"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Trash2, Mail } from "lucide-react"

import api from "@/lib/api"
import { ConsolePage } from "@/components/console/console-page"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { DataTablePagination } from "@/components/shared/data-table-pagination"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { PaginatedResponse, RawMail, BoundAddress } from "@/lib/types"

export default function AllMailsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(0)
  const [pageSize] = useState(20)
  const [filterAddress, setFilterAddress] = useState("")
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { data: addresses } = useQuery({
    queryKey: ["bind_address"],
    queryFn: async () => {
      const { data } = await api.get<{ results: BoundAddress[] }>("/user_api/bind_address")
      return data.results
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ["user_mails", page, pageSize, filterAddress],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String(page * pageSize) })
      if (filterAddress) params.set("address", filterAddress)
      const { data } = await api.get<PaginatedResponse<RawMail>>(`/user_api/mails?${params}`)
      return data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/user_api/mails/${id}`),
    onSuccess: () => {
      toast.success("已删除")
      queryClient.invalidateQueries({ queryKey: ["user_mails"] })
      setDeleteId(null)
    },
    onError: () => toast.error("删除失败"),
  })

  return (
    <ConsolePage title="跨邮箱邮件" description="统一看所有邮箱的邮件">
      <div className="mb-4 flex items-center gap-2">
        <select
          className="h-8 rounded-md border border-border bg-background px-2 text-sm"
          value={filterAddress}
          onChange={(e) => { setFilterAddress(e.target.value); setPage(0) }}
        >
          <option value="">全部邮箱</option>
          {addresses?.map((a) => (
            <option key={a.id} value={a.name}>{a.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : !data?.results?.length ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon"><Mail /></EmptyMedia>
            <EmptyTitle>暂无邮件</EmptyTitle>
            <EmptyDescription>当前筛选条件下没有邮件。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>来源</TableHead>
                <TableHead>时间</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.results.map((mail) => (
                <TableRow key={mail.id}>
                  <TableCell className="text-xs">{mail.id}</TableCell>
                  <TableCell className="font-mono text-xs">{mail.address}</TableCell>
                  <TableCell className="text-xs">{mail.source}</TableCell>
                  <TableCell className="text-xs">{mail.created_at}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-xs" className="text-destructive" onClick={() => setDeleteId(mail.id)}>
                      <Trash2 />
                    </Button>
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
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>删除后无法恢复，确定要删除这封邮件吗？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConsolePage>
  )
}
